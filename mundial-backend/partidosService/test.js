'use strict';
 const {Firestore} = require('@google-cloud/firestore');
 var partidos = [];

  async function test() { 
    const data = require('./data');
    const res = await data.getPartidos();
    const played = res.filter(m => m.jugado);
    console.log("PLAYED MATCHES RETURNED BY getPartidos():");
    console.log(played);
  }
  test();