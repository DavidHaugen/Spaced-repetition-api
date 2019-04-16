const express = require('express')
const LanguageService = require('./language-service')
const { requireAuth } = require('../middleware/jwt-auth')
const jsonParser = express.json()

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

      console.log(head);
      const list = await LanguageService.createLinkedList(req.app.get('db'), req.language.id);
      // console.log(list.head.next.value)
      const [checkNextWord] = await LanguageService.checkGuess(
        req.app.get('db'),
        req.language.id
      )
      if(checkNextWord.translation === guess){
        res.send('you got it right!')
      } else {
        res.send('nope');
      }
      next()
    }
    catch(error){
      next(error)
    }
  })

module.exports = languageRouter
