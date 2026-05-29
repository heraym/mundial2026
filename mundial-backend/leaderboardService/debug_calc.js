const {Firestore} = require('@google-cloud/firestore');
const db = new Firestore();

async function run() {
  try {
    // Fetch usuarios
    const usersSnapshot = await db.collection('usuarios').get();
    const usuarios = [];
    usersSnapshot.forEach(doc => usuarios.push(doc.data()));
    console.log("Usuarios count:", usuarios.length);

    // Fetch partidos
    const partidosSnapshot = await db.collection('partidos').get();
    const partidos = [];
    partidosSnapshot.forEach(doc => {
      const data = doc.data();
      const rawFase = data.fase || data.grupo || "";
      const normalizedFase = (rawFase.length === 1 && rawFase >= 'A' && rawFase <= 'H') ? "Grupos" : rawFase;
      partidos.push({
        id: data.partido || doc.id,
        partido: data.partido || doc.id,
        fase: normalizedFase,
        equipo1: data.equipo1,
        equipo2: data.equipo2,
        golesLocal: data.golesLocal,
        golesVisitante: data.golesVisitante,
        jugado: data.jugado,
        resultado: data.resultado
      });
    });
    console.log("Partidos count:", partidos.length);

    // Fetch apuestas
    const apuestasSnapshot = await db.collection('apuestas').get();
    const apuestas = [];
    apuestasSnapshot.forEach(doc => {
      const data = doc.data();
      apuestas.push({
        ...data,
        golesLocal: parseInt(data.golesLocal),
        golesVisitante: parseInt(data.golesVisitante)
      });
    });
    console.log("Apuestas count:", apuestas.length);

    // Run calculation
    for (let i = 0; i < usuarios.length; i++) {
      usuarios[i].puntos = 0;
    }

    for (let i = 0; i < partidos.length; i++) {
      if (partidos[i].jugado === true) {
        console.log(`Analyzing played match: ${partidos[i].equipo1} vs ${partidos[i].equipo2} (ID: ${partidos[i].id})`);
        for (let j = 0; j < usuarios.length; j++) {
          const user = usuarios[j];
          // Find bet
          const apuesta = apuestas.find(a => (a.usuario === user.usuario) && (a.partido === partidos[i].id));
          if (apuesta) {
            console.log(`Found bet for user ${user.usuario}: ${apuesta.golesLocal} - ${apuesta.golesVisitante}`);
            let puntos = 0;
            let resultado = "";
            if (apuesta.golesLocal > apuesta.golesVisitante) { resultado = "L"; }
            else if (apuesta.golesLocal < apuesta.golesVisitante) { resultado = "V"; }
            else { resultado = "E"; }
            
            console.log(`Bet result: ${resultado}, Match real result: ${partidos[i].resultado}, Fase: ${partidos[i].fase}`);

            if (partidos[i].fase === "Grupos") {
              if (resultado === partidos[i].resultado) {
                console.log(`Outcome matched (+1 pt)`);
                puntos = puntos + 1;
              }
              if ((apuesta.golesLocal === partidos[i].golesLocal) && (apuesta.golesVisitante === partidos[i].golesVisitante)) {
                console.log(`Exact score matched (+2 pts)`);
                puntos = puntos + 2;
                if (parseInt(partidos[i].golesLocal) + parseInt(partidos[i].golesVisitante) > 3) {
                  console.log(`Extra goal bonus (+1 pt)`);
                  puntos = puntos + 1;
                }
              }
            }
            console.log(`Puntos for this match: ${puntos}`);
            user.puntos += puntos;
          } else {
            console.log(`No bet found for user ${user.usuario} for match ${partidos[i].id}`);
          }
        }
      }
    }

    console.log("Calculated users points:");
    usuarios.forEach(u => console.log(`${u.usuario}: ${u.puntos} points`));

  } catch (err) {
    console.error(err);
  }
}
run();
