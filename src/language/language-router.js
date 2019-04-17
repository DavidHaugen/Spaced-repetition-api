const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonParser = express.json()
const {LinkedList, toArray, _Node} = require('../linked-list');

const languageRouter = express.Router()

languageRouter
  .use(requireAuth)
  .use(async (req, res, next) => {
    try {
      const language = await LanguageService.getUsersLanguage(
        req.app.get('db'),
        req.user.id,
      )

      if (!language)
        return res.status(404).json({
          error: `You don't have any languages`,
        })

      req.language = language
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/', async (req, res, next) => {
    try {
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )

      res.json({
        language: req.language,
        words,
      })
      next()
    } catch (error) {
      next(error)
    }
  })

languageRouter
  .get('/head', async (req, res, next) => {
    try{
      const [nextWord] = await LanguageService.getNextWord(
        req.app.get('db'),
        req.language.id
      )
      res.json({
        nextWord: nextWord.original,
        totalScore: req.language.total_score,
        wordCorrectCount: nextWord.correct_count,
        wordIncorrectCount: nextWord.incorrect_count,
      })
      next()
    }
    catch(error) {
      next(error)
    }
  })

languageRouter
  .post('/guess', jsonParser, async (req, res, next) => {
    const guess = req.body.guess;
    if(!guess){
      res.status(400).json({
        error: `Missing 'guess' in request body`,
      })
    }

    try{
      const words = await LanguageService.getLanguageWords(
        req.app.get('db'),
        req.language.id,
      )

      const [{head}] = await LanguageService.getLanguageHead(
        req.app.get('db'),
        req.language.id,
      )

      const list = LanguageService.createLinkedList(words, head)
      // console.log(list.head.next.value)
      // console.log(toArray(list))

//      If the answer was correct:
//      Double the value of M
//      Else, if the answer was wrong:
//      Reset M to 1
//      Move the question back M places in the list
      
      const [checkNextWord] = await LanguageService.checkGuess(
        req.app.get('db'),
        req.language.id
      )
      if(checkNextWord.translation === guess){
        const newMemVal = list.head.value.memory_value * 2;
        list.head.value.memory_value = newMemVal;
        list.head.value.correct_count ++;
        
        let curr = list.head
        let countDown = newMemVal
        while(countDown > 0 && curr.next !== null){
          curr = curr.next
          countDown--;
        }
        const temp = new _Node(list.head.value)

        if(curr.next === null){
          temp.next = curr.next
          curr.next = temp
          list.head = list.head.next
          curr.value.next = temp.value.id
          temp.value.next = null
        } else {
          temp.next = curr.next
          curr.next = temp
          list.head = list.head.next
          curr.value.next = temp.value.id
          temp.value.next = temp.next.value.id
        }
        req.language.total_score++
        await LanguageService.updateWordsTable(
          req.app.get('db'),
          toArray(list),
          req.language.id,
          req.language.total_score
        )
        // {
        //   nextWord: testLanguagesWords[1].original,
        //   totalScore: 1,
        //   wordCorrectCount: 0,
        //   wordIncorrectCount: 0,
        //   answer: testLanguagesWords[0].translation,
        //   isCorrect: true
        // }
        res.json({
          nextWord: list.head.value.original,
          totalScore: req.language.total_score,
          wordCorrectCount: list.head.value.correct_count,
          wordIncorrectCount: list.head.value.incorrect_count,
          answer: temp.value.translation,
          isCorrect: true
        })
      } else {
        list.head.value.memory_value = 1;
        list.head.value.incorrect_count ++;

        let curr = list.head
        let countDown = 1
        while(countDown > 0){
          curr = curr.next
          countDown--;
        }
        
        const temp = new _Node(list.head.value)
        temp.next = curr.next
        curr.next = temp
        list.head = list.head.next
        curr.value.next = temp.value.id
        temp.value.next = temp.next.value.id

        await LanguageService.updateWordsTable(
          req.app.get('db'),
          toArray(list),
          req.language.id,
          req.language.total_score
        )
        res.json({
          nextWord: list.head.value.original,
          totalScore: req.language.total_score,
          wordCorrectCount: list.head.value.correct_count,
          wordIncorrectCount: list.head.value.incorrect_count,
          answer: temp.value.translation,
          isCorrect: false
        });
      }
      next()
    }
    catch(error){
      next(error)
    }
  })

module.exports = languageRouter
