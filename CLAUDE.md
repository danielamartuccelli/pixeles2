# Lima de a dos — guía para Claude Code
- Phaser 3.80.1 + PeerJS, sin bundler: scripts clásicos que comparten `window.G`. Resolución 400x225, pixelArt.
- Todo en español. Todo pixel art procedural (sin fotos originales en el repo). Música procedural original.
- Estructura: src/config.js (lugares, emoticones), state.js (estado, soles, récords), sprites.js (look → sprite), audio.js, net.js (PeerJS), ui.js (DOM), scenes/*, main.js (flujo).
- Marcador: G.state.balance = soles de Daniela; Sebas = −balance; pierde quien llega a −50. Récords siempre guardados.
- Cada minijuego: escena en src/scenes/, registrar en config G.PLACES (quitar `stage`), al ganar llamar G.addSoles/G.recordWin. Ningún juego aburrido: dificultad y competitividad.
- Pruebas: ?solo=1&me=sebas&go=<lugar>; servidor local PeerJS con ?peerhost=localhost&peerport=9000.
- Commits entre etapas.
- v0.4: lugares = igloo (base conjunta), casa_sebas (Miraflores, arriba de Kennedy), cocina (Daniela, Lince). Mapa con scroll vertical (y −70…300) con Callao y Barranco/Los Yuyos (etapa 9, pendiente).
- Kennedy (src/scenes/kennedy.js): carriles arriba=pareja, abajo=yo; misma semilla (host manda k_go); cada cliente simula lo suyo y manda k_pos; k_end con la distancia final. Solo el host aplica G.addSoles/G.recordWin (evita duplicar). Prueba solo: &kdur=SEG&kauto=1 (pareja = bot).
- Pendiente: swimsuits y álbum de fotos vintage (etapa 9), pantalla final (etapa 8).
- PUCP (src/scenes/pucp.js): NPC deterministas (semilla del host, paso fijo 1/30 s); cada cliente juzga si LO vieron (p_fin) y el host decide el marcador (p_res). Prueba: &prounds=3&pauto=1.
- Cocina "Los Ccellis" (etapa 5): lógica pura en src/kitchen_sim.js (G.K: LEVELS con mapas 25x10, RECIPES, Sim; probable con Node). Arte procedural en src/scenes/cocina_art.js. Escena src/scenes/cocina.js: el ANFITRIÓN simula y manda snapshots (c_snap cada 0,1 s + tras cada acción); el invitado manda c_pos (posición) y c_in (pulsar/soltar). Otros mensajes: c_cfg (nivel), c_ready, c_go, c_req (acciones del menú de resultados, las ejecuta el anfitrión), c_brief. Progreso en G.state.kitchen {unlocked, stars, best, prize}. Cooperativo: no mueve soles; al superar el nivel 5 hace recordWin('cocina') para los dos y se viaja a la escena 'martuccini' (premio, foto vintage). Prueba: ?solo=1&go=cocina&clv=N&cauto=1&cdur=S (TAB cambia de cocinero).
- Puffles (sprites.js G.drawPuffle): 22x24 px, cuerpo esponjoso, ojazos, pelito con diseño look.puffle.hair (puntas, rulo, colitas, flequillo, cresta, none) y hairColor ('auto' o hex). Los looks viejos sin 'hair' usan 'puntas'.
- Etapa 6 (v0.7): src/scenes/mg.js (G.mg: rng, bind, btn, panel, nameOf). Pollos: lógica pura src/pollos_sim.js (G.P, probable con Node, nº fijo de sorteos por llegada para que ambos vean lo mismo) + src/scenes/pollos.js; cada uno juega su bar con la misma semilla, mensajes o_cfg/o_ready/o_go/o_sc/o_fin/o_res/o_again; gana más puntos, host aplica soles y récord. Saoco: src/scenes/saoco.js (canciones/charts por dificultad, solo y dupla con árbitro host: s_ev/s_cmd/s_stat/s_end/s_sc/s_fin/s_again, 2 duplas NPC). audio.js: estilos habanera/charanga, G.audio.clock() (paso 16avo) y ajuste G.state.settings.danceOff. state.js: G.recordBest (récord sin victoria). Pruebas: ?go=pollos&pauto=1&pdur=30 · ?go=salsa&smode=&sdiff=&sauto=1.
- Etapa 7 (v0.8): Cuatro en raya = lógica pura src/connect4_sim.js (G.C4, IA minimax para el bot) + src/scenes/conecta4.js (escena 'conecta4', se entra por la mesa del igloo; f_ready/f_go/f_mv; solo host/solo anota G.recordWin('connect4'); empieza el perdedor; sin soles). Card-jitsu = lógica pura src/jitsu_sim.js (G.J: elementos, Chi, bufandas J.BELTS, J.botPick) + src/scenes/cardjitsu.js (escena 'cardjitsu', lugar PLACES.carjitsu; j_ready/j_go/j_pick; misma semilla, solo viajan las cartas elegidas; host da S/10). Bufandas: G.awardBelts(key, gains) con la semilla como clave (no se suma dos veces), mensaje 'belts' con fusión por máximo, accesorio acc.belt (rango) en sprites.js y clóset. OJO teclado: no usar Enter en escenas (abre el chat); main.js registra el preventDefault de flechas/espacio en `window` DESPUÉS de arrancar Phaser (si va antes, Phaser ignora esas teclas). Teclas numéricas en Phaser: 'keydown-ONE'… no 'keydown-1'.
- Etapa 8 (v0.9): src/scenes/fin.js (escena 'fin'). openMap redirige a 'fin' al llegar a ±50 (una vez por victoria, G.finShown); host suma records.matches. Texto = G.relLabel(). Prueba: ?solo=1&go=fin&bal=50. Pendiente: etapa 9 (playas, trajes de baño, álbum).
- Etapa 9 (v1.0): playa.js (BeachBase, CallaoScene), yuyos.js, foto.js (álbum en G.state.album, G.addPhoto). Trajes: G.SWIMSUITS / G.beachLook. Prueba: go=callao&aauto=1, go=yuyos&yauto=1, go=foto.
- v1.1: se ELIMINÓ el modo local (local.html). Solo online. Códigos = palabras de amor de 5 letras (net.js WORDS). Esc global → G.flow.home() (main.js) y cierra modales (.xbtn); no poner manejadores de Esc por escena. Nuevo: src/ui2.js (récords, DJ, TV, dibujo/galería, cartas, decorar; datos permanentes sincronizados por net: draw, drawdel, exhibit, house, letter, galids, album), src/scenes/olivar.js (parque + Mirada fija), Lala (sprites.js G.drawLala, look.lala se desbloquea al visitar casa_sebas), pollos por clics, apuntes en PUCP, G.addSalsaErr. Pruebas: go=olivar&obench=1&oauto=1, ssong/scomp en salsa.

## v1.2 (cambios sobre la v1.1)
- **Versión 1.2.0** (`config.js`).
- **Disfraces** (Clóset → Disfraces, `look.costume`): `osito` (enterizo marrón con capucha, orejas y cola) y `zorrita` (vestido apretado naranja, orejas, cola con punta blanca; bufanda beige en accesorios). Se aplican con un `build()` que envuelve a `build0()` en `sprites.js`. Son diseños originales, no personajes con derechos.
- **Puffles apagados por defecto** (`look.puffleOn`, pestaña Puffle). También aplica a partidas guardadas antiguas.
- **Bubble tea con sabores** (fresa, uva, mango: `acc.bobaFlavor`).
- **Premios permanentes** (`G.PRIZES`, `G.addPrize`, mensaje `prize`): `paletas_oso` (gana Callao) y `llavero` (gana salsa "VS yo", el de mayor puntaje). Se ven en el clóset y en la fila "Premios ganados" de récords.
- **Pizarra compartida**: ambos dibujan a la vez (`dseg`, `dcur`, `dclear`, `dtheme`), con retos de 90 s y galería (`duo:true`).
- **Historia**: Bajada Balta va después de Suiza y Suecia; panel JP; mares "más desafiantes que la Odisea de Odiseo"; anacondas; cama final con pelotas de colores (no pokébolas).
- **Audio**: cada estilo tiene su propio `bus` con fade-out, lo que evita que se solape la música al cambiar de lugar. Estilos nuevos: indie, surf, bossa, noche, cuento, cafe. Cada lugar tiene su canción según su ánimo.
- **Callao**: vida ❤ 100 y frío %, corazones de curación, fogata cura +5/s, números flotantes y tira de ayuda (`a_heal`).
- **PUCP**: cruz "Lux in tenebris" (sin rosa de los vientos ni columnas), ardilla paseante, escondites generados por ronda (`genSpots`: arbustos, árboles, bancas, maceteros, paneles), guardias más fáciles, apuntes con contador. **Pierde la ronda quien lo ven primero** (`seenT`, `p_seen`, `p_fin`); empate ≤0.05 s = pierden ambos.
- **Casa de Sebas**: pósters y fotos. **UI**: botón ◀ Volver en el inicio, ⛶ pantalla completa, 💬 Frases rápidas (Sebas tiene frases extra), emotes oso, oruguita y 👍.
- Sin probar: sesión real entre dos laptops (pizarra, premios, tiempos de PUCP) ni el audio de oído.


## v1.3 (cambios sobre la v1.2)
- **Versión 1.3.0.** La intro de la historia vuelve a empezar con "Había una vez un pingüino solo…" y **ya no** tiene el panel de JP. Lo de JP (Sebas no puede ser visto con una jovencita como Dani) vive solo en las instrucciones del lobby de la PUCP (`pucp.js`, `drawLobby`).
- **Disfraces** (`G.COSTUMES`/`COS` en `sprites.js`): Sebas = oso, cazador de abejas (sombrero con velo y frasco de miel), robot plateado; Dani = osa (con lazo), abeja (antenas y alitas), zorrita, ranita. Todos son diseños originales: **no se dibujan Pikachu, Eevee, Konsento ni Zukin ni pokébolas** (personajes con derechos).
- **Ropa de Sebas** (primeros 5 outfits): polo celeste con triángulos morados; polo blanco con bolitas rojas (patrón `bolitas`); polo marrón con detalles celestes, verdes y rojos; camisa verde olivo manga corta; polo rosado manga larga. Zapatillas naranjas y amarillas, botines marrones (el naranja `#f08a2e` se agregó a los colores de zapatos).
- **TV**: 6 canales nuevos de "sinopsis" (La leyenda de Aang, La leyenda de Korra, BoJack Horseman, Nana, The Ultimatum: Queer Love T1, El amor es ciego: Polonia). Fondo abstracto original + resumen en texto; sin dibujar personajes. Datos de Ultimatum y Love Is Blind: Polska verificados en la web.
- **Olivar**: si ambos aguantan 60 s sin pestañear (`limit`, prueba con `?olimit=4`), los dos ganan el premio `anillo` (anillo de dulce: rosa Dani, azul Sebas), que se activa en Clóset › Accesorios (`acc.candyRing`).
- **Igloo**: lámpara de lava con vidrio cónico, lava animada y mesita blanca (`DECOR.lava`); pouf en forma de pera (`G.drawPouf`) en la TV y como decoración, y **se puede sentar** (E): pose `sit`; en el set de DJ, pose `mix` (solo postura). Las poses viajan en el mensaje `pos` (campo `p`). Moverse las cancela.
- **Baile**: botón 💃 (o tecla B) en la barra de emoticones; `G.flow.dance`, mensaje `dance`, `G.danceFx`. Funciona en igloo y Olivar; moverse corta el baile.
- **Interfaz menos saturada**: paneles plegables con flechas ▸/▾ recordados en `localStorage` (`ui.fold`): marcador de Cuatro en raya, emoticones y menú "Más" (frases, pantalla completa, controles, ajustes). Los controles ya no se muestran fijos en el chat.
- Sin probar: sesión real entre dos laptops (poses, baile, premio del Olivar por red) ni el audio de oído.

## v1.4 (cambios)
- Viajes entre escenas rehechos (G.travel detiene TODAS las escenas de golpe) + vigilante de desincronización (ping con escena/lugar; el host reenvía `goto` si se separan) + banner de aviso. Lobbies Kennedy/PUCP: solo el host manda la configuración.
- Tutorial con dos pingüinos tras la historia (src/scenes/intro.js): 3 botones (primera vez / recordar / directo a la acción), 8 slides (5 en modo recordar).
- Texto nítido: src/textfx.js dibuja los textos a resolución real de pantalla (`?fx=0` lo desactiva).
- Trajes: Sebas "Bola" (enterizo amarillo con orejas y cola), robot celeste con pantalón amarillo y rayas verdes; Dani "Venado" (antes zorrita; guardados migrados).
- Dani: top off-shoulder celeste con diseños blanco/celeste + jean acampanado (outfit nº5 y estilos sueltos en el clóset); aretes: topitos, argollas, flor, largos, largos con flor, estrella, cadena + color (dorado, plateado, colores, 🌈).

## v1.4.1
- Intro sin spoilers (premios = "sorpresas", sin mencionar el festejo de aniversario).
- Emoticones rehechos en 12x12 con contorno automático (G.emoteCanvas, lienzo 14x14).
- Callao: MANTÉN Espacio o E y suelta = piedra con alcance variable (26–270 px, línea punteada + barra de fuerza); toque rápido de E cerca del rival = golpe.
- Música: ya no hay estilo "de fondo" automático (G.audio.style = null → silencio hasta entrar a un lugar con música propia); el planificador salta las notas atrasadas cuando la pestaña estuvo en segundo plano (antes se oían amontonadas).
