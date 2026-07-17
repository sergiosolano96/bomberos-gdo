// Datos maestros: 46 cuerpos, 8 zonas, matriz de viaje (Google Maps, real)
export const RAW = [
  ["buenaventura","BUENAVENTURA","BUENAVENTURA","Cap. Rommel Chunga Angulo","bomberosbun.tesoreria@gmail.com","Z1"],
  ["borrero","DAGUA (Borrero Ayerbe Km30)","BORRERO AYERBE","Subt. Hernán Palmenie Ortega","bomberosborreroayerbekm30@gmail.com","Z1"],
  ["dagua","DAGUA","DAGUA","Cap. Victor Garcia Garcia","bomberosdagua@hotmail.com","Z1"],
  ["lacumbre","LA CUMBRE","LA CUMBRE","Cabo Milton Cesar Sanchez","bomberoslacumbre1958@hotmail.com","Z1"],
  ["cali","CALI","CALI","Cap. Francisco Javier Díaz","notificaciones@bomberoscali.org","Z2"],
  ["yumbo","YUMBO","YUMBO","Cap. Alberto Valencia Puente","cbvyumbo@bomberosyumbo.net","Z2"],
  ["jamundi","JAMUNDÍ","JAMUNDI","Cap. Eduardo Sierra Salinas","jamundibombero@hotmail.com","Z2"],
  ["ptejada","PUERTO TEJADA","PUERTO TEJADA","Tte. Hector Possu Caicedo","bomberos.puertotejada@gmail.com","Z3"],
  ["villarica","VILLA RICA","VILLA RICA","Cap. Urdelis Viveros","cbvvillarica@gmail.com","Z3"],
  ["guachene","GUACHENÉ","GUACHENÉ","Cap. Ivan Yesid Banguero","bomberosguachene@hotmail.com","Z3"],
  ["padilla","PADILLA","PADILLA","Tte. Jaime Luis Gonzalia","bomberospadilla@yahoo.es","Z3"],
  ["caloto","CALOTO","CALOTO","Tte. Alfredo Guevara","bomberosvoluntarioscaloto@gmail.com","Z3"],
  ["quilichao","SANTANDER DE QUILICHAO","S. DE QUILICHAO","Esther Inés Fernandez","bomberosquilichao@hotmail.com","Z3"],
  ["corinto","CORINTO","CORINTO","Mervin Antonio Parra","bomberoscorintocauca@yahoo.com","Z3"],
  ["miranda","MIRANDA","MIRANDA","Subt. Willian Zaraste","bomberosmiranda@hotmail.com","Z3"],
  ["candelaria","CANDELARIA","CANDELARIA","Subt. Yesenia Mejía Rodriguez","bomberoscandelariavalle@yahoo.com","Z4"],
  ["palmira","PALMIRA","PALMIRA VOLUNTARIOS","Cap. Ayda Elena Córdoba","bomberospal@gmail.com","Z4"],
  ["pradera","PRADERA","PRADERA","Tte. Diomedes Paredes Castillo","bomberospradera@hotmail.com","Z4"],
  ["florida","FLORIDA","FLORIDA","Subt. Juan Carlos Restrepo","bomberosflorida@yahoo.es","Z4"],
  ["cerrito","EL CERRITO","EL CERRITO","Cap. Harvey Hernán Trujillo","bomberoscerrito@hotmail.com","Z4"],
  ["buga","GUADALAJARA DE BUGA","BUGA","Cap. Harold Humberto Alzate","bomberosbuga@gmail.com","Z5"],
  ["guacari","GUACARÍ","GUACARI","Tte. Guillermo León Bonilla","cbvguacari1962@yahoo.com.co","Z5"],
  ["ginebra","GINEBRA","GINEBRA","Subt. Jorge Alain Baltazar","bomberosginebra1103@hotmail.com","Z5"],
  ["yotoco","YOTOCO","YOTOCO","Cap. Luis Alfonso Herrera","bomberos_yotoco@yahoo.com","Z5"],
  ["vijes","VIJES","VIJES","Cap. Elver Alberto Granja","bomberos1vijes@hotmail.com","Z5"],
  ["restrepo","RESTREPO","RESTREPO","Subt. Julio Cesar Giraldo","bomberosrestrepo@hotmail.com","Z5"],
  ["calima","CALIMA (El Darién)","CALIMA EL DARIEN","Cap. Rodrigo Hernandez Ospina","bomberosvoluntariosdarien@hotmail.com","Z5"],
  ["tulua","TULUÁ","TULUÁ","Tte. Ruben Dario Lozano","admin@bomberostulua.com.co","Z6"],
  ["andalucia","ANDALUCÍA","ANDALUCIA","Cap. Francisco Javier Henao","bomberos_andalucia@hotmail.com","Z6"],
  ["bugalagrande","BUGALAGRANDE","BUGALAGRANDE","Subt. Beimar Sepulveda","cbvbgb@gmail.com","Z6"],
  ["sanpedro","SAN PEDRO","SAN PEDRO","Cap. Luis Octavio Mazo","bomberossanpedrovalle1965@gmail.com","Z6"],
  ["riofrio","RIOFRÍO","RIOFRÍO","Rodrigo Alvarado Lozano","cbv-riofrio@hotmail.com","Z6"],
  ["trujillo","TRUJILLO","TRUJILLO","Cap. José Albeiro Giraldo","cbvtrujillovalle@hotmail.com","Z6"],
  ["zarzal","ZARZAL","ZARZAL","Subt. Oscar Reyes","cbomberoszarzal@yahoo.es","Z7"],
  ["roldanillo","ROLDANILLO","ROLDANILLO","Cap. María del Rosario Gómez","cbvrol@yahoo.es","Z7"],
  ["launion","LA UNIÓN","LA UNIÓN","Subt. Julian Andres Granados","cbvlaunionv@gmail.com","Z7"],
  ["lavictoria","LA VICTORIA","LA VICTORIA","Subt. Liliana Yepes Vega","cbvlavictoria@hotmail.com","Z7"],
  ["bolivar","BOLÍVAR","BOLIVAR","Cap. Fabian Barona González","bolivar24b1@hotmail.com","Z7"],
  ["dovio","EL DOVIO","EL DOVIO","Cabo Enuar Rodriguez Marin","cbeldovio@gmail.com","Z7"],
  ["toro","TORO","TORO","Tte. Jhon Jairo Guerra","bomberostoro@hotmail.com","Z7"],
  ["cartago","CARTAGO","CARTAGO","Subt. Diana Lorena Gómez","bomberosctgo@yahoo.es","Z8"],
  ["obando","OBANDO","OBANDO","Bomb. Juan Camilo Ospina","bomberosvol.obando@gmail.com","Z8"],
  ["alcala","ALCALÁ","ALCALA","Sgto. Jorge Hernán Taborda","bomberosalcala@hotmail.com","Z8"],
  ["ansermanuevo","ANSERMANUEVO","ANSERMANUEVO","Subt. Jose Guillermo Gutierrez","bomberosansermanuevo@gmail.com","Z8"],
  ["sevilla","SEVILLA","SEVILLA","Cap. Rafael Arango Vasquez","secrebomberos@hotmail.com","Z8"],
  ["caicedonia","CAICEDONIA","CAICEDONIA","Subt. Ever Marino Gonzalez","bcv54@hotmail.com","Z8"]
];

export const ZONAS = {
  Z1:"Z1 · Corredor Pacífico", Z2:"Z2 · Cali metropolitana", Z3:"Z3 · Norte del Cauca",
  Z4:"Z4 · Sur-oriente Valle", Z5:"Z5 · Centro", Z6:"Z6 · Centro-norte",
  Z7:"Z7 · Norte", Z8:"Z8 · Norte extremo",
};

export const ORDEN_ZONAS = ["Z2","Z4","Z3","Z1","Z5","Z6","Z7","Z8"];

// Tiempos de conducción reales (min) intra-zona, cacheados de Google Maps
export const MATRIZ = {"buenaventura":{"borrero":160,"dagua":100,"lacumbre":165},"borrero":{"buenaventura":150,"dagua":60,"lacumbre":95},"dagua":{"buenaventura":85,"borrero":65,"lacumbre":70},"lacumbre":{"buenaventura":155,"borrero":95,"dagua":70},"cali":{"yumbo":35,"jamundi":45},"yumbo":{"cali":35,"jamundi":80},"jamundi":{"cali":45,"yumbo":70},"ptejada":{"villarica":15,"guachene":25,"padilla":25,"caloto":40,"quilichao":30,"corinto":40,"miranda":45},"villarica":{"ptejada":15,"guachene":25,"padilla":30,"caloto":30,"quilichao":25,"corinto":45,"miranda":50},"guachene":{"ptejada":25,"villarica":25,"padilla":35,"caloto":20,"quilichao":35,"corinto":45,"miranda":50},"padilla":{"ptejada":25,"villarica":35,"guachene":35,"caloto":45,"quilichao":50,"corinto":15,"miranda":20},"caloto":{"ptejada":35,"villarica":25,"guachene":20,"padilla":45,"quilichao":20,"corinto":35,"miranda":50},"quilichao":{"ptejada":35,"villarica":25,"guachene":35,"padilla":50,"caloto":20,"corinto":50,"miranda":65},"corinto":{"ptejada":45,"villarica":50,"guachene":45,"padilla":15,"caloto":35,"quilichao":50,"miranda":15},"miranda":{"ptejada":45,"villarica":50,"guachene":55,"padilla":20,"caloto":50,"quilichao":65,"corinto":20},"candelaria":{"palmira":25,"pradera":20,"florida":25,"cerrito":35},"palmira":{"candelaria":25,"pradera":30,"florida":45,"cerrito":25},"pradera":{"candelaria":25,"palmira":30,"florida":20,"cerrito":50},"florida":{"candelaria":25,"palmira":45,"pradera":20,"cerrito":55},"cerrito":{"candelaria":35,"palmira":25,"pradera":50,"florida":55},"buga":{"guacari":25,"ginebra":35,"yotoco":20,"vijes":45,"restrepo":50,"calima":65},"guacari":{"buga":25,"ginebra":20,"yotoco":35,"vijes":40,"restrepo":65,"calima":75},"ginebra":{"buga":35,"guacari":15,"yotoco":40,"vijes":45,"restrepo":70,"calima":85},"yotoco":{"buga":25,"guacari":30,"ginebra":45,"vijes":30,"restrepo":45,"calima":55},"vijes":{"buga":45,"guacari":40,"ginebra":45,"yotoco":30,"restrepo":65,"calima":80},"restrepo":{"buga":55,"guacari":60,"ginebra":75,"yotoco":40,"vijes":65,"calima":50},"calima":{"buga":70,"guacari":75,"ginebra":90,"yotoco":60,"vijes":80,"restrepo":45},"tulua":{"andalucia":20,"bugalagrande":20,"sanpedro":15,"riofrio":25,"trujillo":40},"andalucia":{"tulua":20,"bugalagrande":15,"sanpedro":25,"riofrio":35,"trujillo":55},"bugalagrande":{"tulua":20,"andalucia":15,"sanpedro":25,"riofrio":40,"trujillo":60},"sanpedro":{"tulua":15,"andalucia":25,"bugalagrande":25,"riofrio":35,"trujillo":55},"riofrio":{"tulua":25,"andalucia":40,"bugalagrande":40,"sanpedro":35,"trujillo":20},"trujillo":{"tulua":40,"andalucia":55,"bugalagrande":60,"sanpedro":50,"riofrio":15},"zarzal":{"roldanillo":20,"launion":35,"lavictoria":25,"bolivar":30,"dovio":55,"toro":45},"roldanillo":{"zarzal":15,"launion":25,"lavictoria":30,"bolivar":15,"dovio":40,"toro":35},"launion":{"zarzal":30,"roldanillo":20,"lavictoria":15,"bolivar":30,"dovio":45,"toro":15},"lavictoria":{"zarzal":25,"roldanillo":30,"launion":15,"bolivar":40,"dovio":60,"toro":20},"bolivar":{"zarzal":25,"roldanillo":15,"launion":35,"lavictoria":40,"dovio":55,"toro":45},"dovio":{"zarzal":50,"roldanillo":40,"launion":45,"lavictoria":55,"bolivar":55,"toro":55},"toro":{"zarzal":40,"roldanillo":35,"launion":20,"lavictoria":25,"bolivar":45,"dovio":60},"cartago":{"obando":25,"alcala":35,"ansermanuevo":25,"sevilla":100,"caicedonia":95},"obando":{"cartago":25,"alcala":50,"ansermanuevo":45,"sevilla":80,"caicedonia":75},"alcala":{"cartago":35,"obando":55,"ansermanuevo":60,"sevilla":95,"caicedonia":85},"ansermanuevo":{"cartago":25,"obando":45,"alcala":55,"sevilla":115,"caicedonia":115},"sevilla":{"cartago":100,"obando":75,"alcala":100,"ansermanuevo":115,"caicedonia":30},"caicedonia":{"cartago":100,"obando":75,"alcala":85,"ansermanuevo":115,"sevilla":30}};

export const M = {};
RAW.forEach(r => { M[r[0]] = { id:r[0], muni:r[1], cuerpo:r[2], cmd:r[3], email:r[4], zona:r[5] }; });
