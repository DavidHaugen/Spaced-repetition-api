'use strict';

const {LinkedList, toArray} = require('../linked-list');


const LanguageService = {
  getUsersLanguage(db, user_id) {
    return db
      .from('language')
      .select(
        'language.id',
        'language.name',
        'language.user_id',
        'language.head',
        'language.total_score'
      )
      .where('language.user_id', user_id)
      .first();
  },

  getLanguageWords(db, language_id) {
    return db
      .from('word')
      .select(
        'id',
        'language_id',
        'original',
        'translation',
        'next',
        'memory_value',
        'correct_count',
        'incorrect_count'
      )
      .where({ language_id });
  },

  // getUserWords(db, language_id){

  // }

  getNextWord(db, language_id){
    return db
      .from('word')
      .join('language', 'word.id','=','language.head')
      .select(
        'original',
        'language_id',
        'correct_count',
        'incorrect_count'
      )
      .where({language_id});
  },

  checkGuess(db, language_id){
    return db
      .from('word')
      .join('language', 'word.id','=','language.head')
      .select(
        '*'
      )
      .where({language_id});
  },

  getLanguageHead(db, language_id){
    return db
      .from('language')
      .join('word', 'word.language_id','=','language.id')
      .select('head')
      .groupBy('head')
      .where({language_id});
  },

  getWord(db, language_id){
    // 
  },

  createLinkedList(db, language_id){
    const list = new LinkedList();
    this.getLanguageHead(
      db,
      language_id
    )
      // .then(head => head[0].head)
      .then(head => {list.insertAfter(head);console.log(list.head.value);});
    // words.forEach(word => {
    //   list.insertLast(word);
    // });
    
    return list;
  }
  // createLinkedList()
};

module.exports = LanguageService;
