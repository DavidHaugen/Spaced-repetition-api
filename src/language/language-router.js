const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonParser = express.json()
const {LinkedList, toArray} = require('../linked-list');

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
      console.log(list.head.next.value)
      console.log(toArray(list))

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
        // while(memVal > 0){
        //   current
        // }
        res.send('you got it right!')
      } else {
        list.head.value.memory_value = 1;
        list.head.value.incorrect_count ++;
        res.send('nope');
      }
      next()
    }
    catch(error){
      next(error)
    }
  })

module.exports = languageRouter
