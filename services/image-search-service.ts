// Servicio para buscar imágenes relacionadas con productos
// Utiliza múltiples fuentes de imágenes gratuitas

export interface ImageSearchResult {
  url: string
  thumbnail: string
  source: string
  alt: string
}

// Mapeo de palabras clave en español a inglés para mejor búsqueda
const spanishToEnglish: Record<string, string> = {
  // Alimentos
  leche: "milk bottle dairy",
  pan: "bread loaf bakery",
  arroz: "rice bag grain",
  frijoles: "beans legumes",
  frijol: "beans legumes",
  azúcar: "sugar bag",
  azucar: "sugar bag",
  aceite: "cooking oil bottle",
  huevos: "eggs carton",
  huevo: "eggs carton",
  pollo: "chicken meat raw",
  carne: "meat beef raw",
  res: "beef meat raw",
  cerdo: "pork meat raw",
  pescado: "fish seafood raw",
  atún: "tuna can fish",
  atun: "tuna can fish",
  sardinas: "sardines can fish",
  queso: "cheese dairy",
  mantequilla: "butter dairy",
  yogurt: "yogurt dairy cup",
  yogur: "yogurt dairy cup",
  crema: "cream dairy",
  mayonesa: "mayonnaise jar",
  mostaza: "mustard bottle",
  ketchup: "ketchup bottle",
  salsa: "sauce bottle",
  sal: "salt shaker",
  pimienta: "pepper spice",
  café: "coffee beans bag",
  cafe: "coffee beans bag",
  té: "tea bags box",
  te: "tea bags box",
  chocolate: "chocolate bar candy",
  caramelo: "caramel candy",
  caramelos: "caramel candy",
  dulce: "caramel candy",
  dulces: "caramel candy",
  gomitas: "caramel candy",
  paleta: "caramel candy",
  paletas: "caramel candy",
  galletas: "cookies biscuits",
  galleta: "cookies biscuits",
  cereal: "cereal box breakfast",
  avena: "oatmeal breakfast",
  harina: "flour bag baking",
  pasta: "pasta noodles italian",
  fideos: "noodles pasta",
  sopa: "soup can",
  
  // Snacks y botanas
  papas: "potato chips snack bag",
  papitas: "potato chips snack bag",
  "papas fritas": "potato chips snack bag",
  frituras: "chips snack bag",
  doritos: "doritos chips snack",
  cheetos: "cheetos snack",
  sabritas: "potato chips snack bag",
  nachos: "nachos chips",
  palomitas: "popcorn snack",
  cacahuates: "peanuts snack",
  nueces: "nuts walnuts",
  almendras: "almonds nuts",
  
  // Frutas y verduras
  manzana: "apple fruit red",
  manzanas: "apples fruit red",
  naranja: "orange fruit citrus",
  naranjas: "oranges fruit citrus",
  plátano: "banana fruit yellow",
  platano: "banana fruit yellow",
  plátanos: "bananas fruit yellow",
  platanos: "bananas fruit yellow",
  uvas: "grapes fruit purple",
  uva: "grapes fruit purple",
  fresa: "strawberry fruit red",
  fresas: "strawberries fruit red",
  limón: "lemon citrus fruit",
  limon: "lemon citrus fruit",
  limones: "lemons citrus fruit",
  lima: "lime citrus fruit",
  piña: "pineapple fruit tropical",
  pina: "pineapple fruit tropical",
  sandía: "watermelon fruit",
  sandia: "watermelon fruit",
  melón: "melon cantaloupe fruit",
  melon: "melon cantaloupe fruit",
  mango: "mango fruit tropical",
  mangos: "mangos fruit tropical",
  papaya: "papaya fruit tropical",
  aguacate: "avocado fruit green",
  aguacates: "avocados fruit green",
  tomate: "tomato vegetable red",
  tomates: "tomatoes vegetable red",
  jitomate: "tomato vegetable red",
  cebolla: "onion vegetable",
  cebollas: "onions vegetable",
  ajo: "garlic vegetable",
  zanahoria: "carrot vegetable orange",
  zanahorias: "carrots vegetable orange",
  papa: "potato vegetable",
  patata: "potato vegetable",
  patatas: "potatoes vegetable",
  lechuga: "lettuce vegetable green",
  espinaca: "spinach vegetable green",
  espinacas: "spinach vegetable green",
  brócoli: "broccoli vegetable green",
  brocoli: "broccoli vegetable green",
  pepino: "cucumber vegetable green",
  pepinos: "cucumbers vegetable green",
  chile: "chili pepper spicy",
  chiles: "chili peppers spicy",
  pimiento: "bell pepper vegetable",
  pimientos: "bell peppers vegetable",
  maíz: "corn vegetable yellow",
  maiz: "corn vegetable yellow",
  elote: "corn cob vegetable",
  elotes: "corn cobs vegetable",
  
  // Bebidas
  agua: "water bottle drink",
  refresco: "soda cola drink",
  refrescos: "soda drinks bottles",
  "coca cola": "coca cola soda drink",
  coca: "coca cola soda drink",
  pepsi: "pepsi soda drink",
  sprite: "sprite soda drink",
  fanta: "fanta soda drink orange",
  jugo: "juice bottle drink",
  jugos: "juice bottles drink",
  cerveza: "beer bottle alcohol",
  cervezas: "beer bottles alcohol",
  cervesa: "beer bottle alcohol",
  cervesas: "beer bottles alcohol",
  chela: "beer bottle alcohol",
  chelas: "beer bottles alcohol",
  vino: "wine bottle alcohol",
  vinos: "wine bottles alcohol",
  tequila: "tequila bottle alcohol",
  ron: "rum bottle alcohol",
  whisky: "whiskey bottle alcohol",
  vodka: "vodka bottle alcohol",
  licor: "liquor bottle alcohol",
  
  // Productos de limpieza
  jabón: "soap",
  jabon: "soap",
  detergente: "detergent",
  cloro: "bleach",
  desinfectante: "disinfectant",
  limpiador: "cleaner",
  esponja: "sponge",
  escoba: "broom",
  trapeador: "mop",
  
  // Productos de higiene personal
  shampoo: "shampoo",
  champú: "shampoo",
  champu: "shampoo",
  acondicionador: "conditioner",
  "pasta dental": "toothpaste",
  "cepillo de dientes": "toothbrush",
  desodorante: "deodorant",
  "papel higiénico": "toilet paper",
  "papel higienico": "toilet paper",
  pañales: "diapers",
  panales: "diapers",
  toallas: "towels",
  
  // Electrodomésticos y tecnología
  televisor: "television",
  televisión: "television",
  television: "television",
  computadora: "computer",
  laptop: "laptop",
  celular: "smartphone",
  teléfono: "phone",
  telefono: "phone",
  tablet: "tablet",
  refrigerador: "refrigerator",
  nevera: "refrigerator",
  lavadora: "washing machine",
  secadora: "dryer",
  microondas: "microwave",
  licuadora: "blender",
  cafetera: "coffee maker",
  tostadora: "toaster",
  plancha: "iron",
  ventilador: "fan",
  
  // Ropa
  camisa: "shirt",
  camiseta: "t-shirt",
  pantalón: "pants",
  pantalon: "pants",
  jeans: "jeans",
  vestido: "dress",
  falda: "skirt",
  zapatos: "shoes",
  tenis: "sneakers",
  sandalias: "sandals",
  calcetines: "socks",
  ropa: "clothing",
  
  // Muebles
  silla: "chair",
  mesa: "table",
  sofá: "sofa",
  sofa: "sofa",
  cama: "bed",
  escritorio: "desk",
  estante: "shelf",
  
  // Otros
  libro: "book",
  cuaderno: "notebook",
  lápiz: "pencil",
  lapiz: "pencil",
  pluma: "pen",
  bolígrafo: "pen",
  boligrafo: "pen",
  tijeras: "scissors",
  cinta: "tape",
  pegamento: "glue",
}

// Función para corregir errores ortográficos comunes
function correctSpelling(term: string): string {
  const corrections: Record<string, string> = {
    cervesa: "cerveza",
    cervesas: "cervezas",
    servexa: "cerveza",
    servesa: "cerveza",
    papaz: "papas",
    paps: "papas",
    letche: "leche",
    leche: "leche",
    platanos: "plátanos",
    platano: "plátano",
    jugo: "jugo",
    aguacates: "aguacates",
    tomates: "tomates",
    manzanas: "manzanas",
    naranjas: "naranjas",
  }
  
  const lowerTerm = term.toLowerCase().trim()
  return corrections[lowerTerm] || lowerTerm
}

// Función para traducir términos de búsqueda
function translateSearchTerm(term: string): string {
  // Primero corregir ortografía
  const correctedTerm = correctSpelling(term.toLowerCase().trim())
  
  // Buscar coincidencia exacta
  if (spanishToEnglish[correctedTerm]) {
    return spanishToEnglish[correctedTerm]
  }
  
  // Buscar coincidencia parcial - priorizar coincidencias más largas
  const matches: { spanish: string; english: string; length: number }[] = []
  
  for (const [spanish, english] of Object.entries(spanishToEnglish)) {
    if (correctedTerm.includes(spanish)) {
      matches.push({ spanish, english, length: spanish.length })
    } else if (spanish.includes(correctedTerm) && correctedTerm.length >= 3) {
      matches.push({ spanish, english, length: correctedTerm.length })
    }
  }
  
  // Ordenar por longitud de coincidencia (más larga = mejor)
  if (matches.length > 0) {
    matches.sort((a, b) => b.length - a.length)
    return matches[0].english
  }
  
  // Si no hay traducción, devolver el término original con "food product" como contexto
  return `${term} food product`
}

// Función para limpiar el nombre del producto para búsqueda
function cleanProductName(name: string): string {
  // Eliminar marcas comunes y texto entre paréntesis
  let cleaned = name
    .toLowerCase()
    .replace(/\([^)]*\)/g, "") // Eliminar texto entre paréntesis
    .replace(/\[[^\]]*\]/g, "") // Eliminar texto entre corchetes
    .replace(/\d+\s*(ml|l|g|kg|oz|lb|pz|piezas|unidades|pack)/gi, "") // Eliminar cantidades
    .replace(/\d+x\d+/gi, "") // Eliminar formatos como 6x500
    .replace(/[^\w\sáéíóúñü]/g, " ") // Eliminar caracteres especiales
    .replace(/\s+/g, " ") // Normalizar espacios
    .trim()
  
  // Obtener la primera o las dos primeras palabras significativas
  const words = cleaned.split(" ").filter(word => word.length > 2)
  const searchTerm = words.slice(0, 2).join(" ")
  
  return translateSearchTerm(searchTerm) || searchTerm
}

// URLs de imágenes predefinidas por categoría de producto
// Esto garantiza que siempre se muestren imágenes reales y relevantes
const productImages: Record<string, string[]> = {
  // Snacks
  "potato chips snack bag": [
    "https://images.pexels.com/photos/568805/pexels-photo-568805.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/5945755/pexels-photo-5945755.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "chips snack bag": [
    "https://images.pexels.com/photos/568805/pexels-photo-568805.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Dulces
  "caramel candy": [
    "https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/4110101/pexels-photo-4110101.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "chocolate bar candy": [
    "https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "cookies biscuits": [
    "https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Bebidas
  "beer bottle alcohol": [
    "https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=400",
    "https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "beer bottles alcohol": [
    "https://images.pexels.com/photos/1089930/pexels-photo-1089930.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "soda cola drink": [
    "https://images.pexels.com/photos/2983100/pexels-photo-2983100.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "water bottle drink": [
    "https://images.pexels.com/photos/1000084/pexels-photo-1000084.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "juice bottle drink": [
    "https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "wine bottle alcohol": [
    "https://images.pexels.com/photos/374885/pexels-photo-374885.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "coffee beans bag": [
    "https://images.pexels.com/photos/585753/pexels-photo-585753.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Lácteos
  "milk bottle dairy": [
    "https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "cheese dairy": [
    "https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "yogurt dairy cup": [
    "https://images.pexels.com/photos/373882/pexels-photo-373882.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "eggs carton": [
    "https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "butter dairy": [
    "https://images.pexels.com/photos/531334/pexels-photo-531334.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Carnes
  "chicken meat raw": [
    "https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "meat beef raw": [
    "https://images.pexels.com/photos/618775/pexels-photo-618775.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "pork meat raw": [
    "https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "fish seafood raw": [
    "https://images.pexels.com/photos/229789/pexels-photo-229789.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Frutas
  "apple fruit red": [
    "https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "banana fruit yellow": [
    "https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "orange fruit citrus": [
    "https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "grapes fruit purple": [
    "https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "strawberries fruit red": [
    "https://images.pexels.com/photos/46174/strawberries-berries-fruit-freshness-46174.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "watermelon fruit": [
    "https://images.pexels.com/photos/1313267/pexels-photo-1313267.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "pineapple fruit tropical": [
    "https://images.pexels.com/photos/947879/pexels-photo-947879.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "avocado fruit green": [
    "https://images.pexels.com/photos/557659/pexels-photo-557659.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "mango fruit tropical": [
    "https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "lemon citrus fruit": [
    "https://images.pexels.com/photos/1414110/pexels-photo-1414110.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Verduras
  "tomato vegetable red": [
    "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "onion vegetable": [
    "https://images.pexels.com/photos/175414/pexels-photo-175414.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "carrot vegetable orange": [
    "https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "potato vegetable": [
    "https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "lettuce vegetable green": [
    "https://images.pexels.com/photos/1199562/pexels-photo-1199562.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "broccoli vegetable green": [
    "https://images.pexels.com/photos/47347/broccoli-vegetable-food-healthy-47347.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "corn vegetable yellow": [
    "https://images.pexels.com/photos/547263/pexels-photo-547263.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "garlic vegetable": [
    "https://images.pexels.com/photos/928251/pexels-photo-928251.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "cucumber vegetable green": [
    "https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "bell pepper vegetable": [
    "https://images.pexels.com/photos/128536/pexels-photo-128536.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Panadería y granos
  "bread loaf bakery": [
    "https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "rice bag grain": [
    "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "pasta noodles italian": [
    "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "cereal box breakfast": [
    "https://images.pexels.com/photos/135525/pexels-photo-135525.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "flour bag baking": [
    "https://images.pexels.com/photos/5765/flour-powder-wheat-jar.jpg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Condimentos
  "cooking oil bottle": [
    "https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=400",
  ],
  "sugar bag": [
    "https://images.pexels.com/photos/2523650/pexels-photo-2523650.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "salt shaker": [
    "https://images.pexels.com/photos/2213592/pexels-photo-2213592.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Limpieza
  "soap": [
    "https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "detergent": [
    "https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  // Higiene personal
  "shampoo": [
    "https://images.pexels.com/photos/3735218/pexels-photo-3735218.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "toothpaste": [
    "https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
  "toilet paper": [
    "https://images.pexels.com/photos/3958212/pexels-photo-3958212.jpeg?auto=compress&cs=tinysrgb&w=400",
  ],
}

// Imagen genérica de producto para cuando no hay coincidencia
const genericProductImages = [
  "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=400", // Supermercado
  "https://images.pexels.com/photos/3962285/pexels-photo-3962285.jpeg?auto=compress&cs=tinysrgb&w=400", // Producto
  "https://images.pexels.com/photos/4033148/pexels-photo-4033148.jpeg?auto=compress&cs=tinysrgb&w=400", // Compras
]

// Función para obtener una imagen del diccionario
function getImageFromDictionary(searchTerm: string): string | null {
  // Buscar coincidencia exacta
  if (productImages[searchTerm]) {
    const images = productImages[searchTerm]
    return images[Math.floor(Math.random() * images.length)]
  }
  
  // Buscar coincidencia parcial
  for (const [key, images] of Object.entries(productImages)) {
    const keyWords = key.split(" ")
    const searchWords = searchTerm.split(" ")
    
    // Si alguna palabra clave coincide
    for (const searchWord of searchWords) {
      if (keyWords.some(kw => kw.includes(searchWord) || searchWord.includes(kw))) {
        return images[Math.floor(Math.random() * images.length)]
      }
    }
  }
  
  return null
}

function getUnsplashSourceUrl(searchTerm: string): string {
  // Implementación ficticia para ejemplo
  return `https://source.unsplash.com/400x400/?${searchTerm}`;
}

function getLoremFlickrUrl(searchTerm: string): string {
  // Implementación ficticia para ejemplo
  return `https://loremflickr.com/400/400/${searchTerm}`;
}

export const ImageSearchService = {
  /**
   * Busca una imagen relacionada con el nombre del producto
   * @param productName Nombre del producto
   * @returns URL de la imagen encontrada o null si no se encuentra
   */
  searchProductImage: async (productName: string): Promise<string | null> => {
    try {
      if (!productName || productName.trim().length === 0) {
        return null
      }

      const searchTerm = cleanProductName(productName)
      console.log(`[ImageSearch] Buscando imagen para: "${productName}" -> "${searchTerm}"`)

      // Primero buscar en el diccionario de imágenes predefinidas
      const imageFromDict = getImageFromDictionary(searchTerm)
      if (imageFromDict) {
        console.log(`[ImageSearch] Imagen encontrada en diccionario: ${imageFromDict}`)
        return imageFromDict
      }
      
      // Si no hay coincidencia, devolver imagen genérica de producto
      const genericImage = genericProductImages[Math.floor(Math.random() * genericProductImages.length)]
      console.log(`[ImageSearch] Usando imagen genérica: ${genericImage}`)
      return genericImage

    } catch (error) {
      console.error("[ImageSearch] Error buscando imagen:", error)
      return genericProductImages[0]
    }
  },

  /**
   * Obtiene una imagen de producto o devuelve la imagen por defecto
   * @param productName Nombre del producto
   * @param existingImage Imagen existente (si ya tiene una)
   * @returns URL de la imagen
   */
  getProductImageOrSearch: async (productName: string, existingImage?: string | null): Promise<string> => {
    // Si ya tiene una imagen válida, devolverla
    if (existingImage && existingImage !== "/sin-imagen-disponible.jpg" && existingImage.trim() !== "") {
      return existingImage
    }

    // Buscar una imagen relacionada
    const foundImage = await ImageSearchService.searchProductImage(productName)
    
    if (foundImage) {
      return foundImage
    }

    // Si no se encuentra nada, devolver la imagen por defecto
    return "/sin-imagen-disponible.jpg"
  },

  /**
   * Traduce un término de búsqueda del español al inglés
   * @param term Término en español
   * @returns Término traducido o el original si no hay traducción
   */
  translateTerm: translateSearchTerm,

  /**
   * Limpia el nombre del producto para búsqueda
   * @param name Nombre del producto
   * @returns Nombre limpio para búsqueda
   */
  cleanName: cleanProductName,
}
