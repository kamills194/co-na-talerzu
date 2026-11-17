// Recipe and product texts: English (en-GB). Text only — amounts, units, ids, allergens and flags come from
// recipes.pl.js. Each recipe has exactly as many steps as in Polish. Format: docs/TLUMACZENIA.md.
// Machine translation (CNT-030), not reviewed by a native speaker or tested in a kitchen.
export const products = {
  oats:'Rolled oats', milk:'Milk', apple:'Apple', cinnamon:'Cinnamon', egg:'Egg', butter:'Butter', bread:'Bread', tomato:'Tomato',
  cheese:'Quark (Polish curd cheese)', yogurt:'Plain yoghurt', radish:'Radish', cucumber:'Cucumber', banana:'Banana', carrot:'Carrot', hummus:'Hummus', rice:'Rice',
  passata:'Tomato passata', water:'Water', oil:'Rapeseed oil', salt:'Salt', potato:'Potatoes', chicken:'Chicken breast', paprika:'Ground sweet paprika',
  pasta:'Egg-free wheat pasta', onion:'Onion', lentils:'Dried red lentils', chickpeas:'Tinned chickpeas, drained', pepper:'Fresh bell pepper', flour:'Wheat flour', sugar:'Sugar',
  cocoa:'Cocoa powder', beans:'Tinned beans, drained', lemon:'Lemon', garlic:'Garlic',
  semolina:'Semolina', buckwheat:'Roasted buckwheat groats', kefir:'Kefir', sourcream:'Sour cream 18%',
  mackerel:'Smoked mackerel fillet', chives:'Chives', dill:'Dill', blackpepper:'Ground black pepper',
  yellowcheese:'Hard cheese (e.g. Gouda)', mozzarella:'Mozzarella', oliveoil:'Olive oil', basil:'Fresh basil',
  parsley:'Flat-leaf parsley', zucchini:'Courgette', eggplant:'Aubergine', cabbage:'White cabbage',
  mushroom:'Button mushrooms', orange:'Orange', berries:'Frozen mixed berries', potatostarch:'Potato starch',
  vinegar:'Cider vinegar', tuna:'Tuna in brine, drained', mincedpork:'Minced pork',
  ham:'Cooked ham, sliced', sushirice:'Sushi rice', soysauce:'Soy sauce',
  miso:'Miso paste', tofu:'Plain tofu', nori:'Nori sheet', sesame:'Sesame seeds',
};
export const recipes = {
  'owsianka':{ name:'Porridge with apple and cinnamon', steps:[
    'Put the oats in a small pan, pour in the milk and bring to a gentle boil.',
    'Simmer over a low heat for 5–7 minutes, stirring, until the oats are soft.',
    'Wash the apple, remove the core and grate it. Add to the porridge with the cinnamon and heat for a minute.'],
    photoAlt:'A bowl of milk porridge with grated apple and cinnamon' },
  'jajecznica':{ name:'Scrambled eggs with tomato', steps:[
    'Wash the tomato and dice it. Heat the butter in a frying pan.',
    'Add the tomato and fry for 2 minutes. Crack in the eggs, season with salt and stir over a low heat until fully set.',
    'Serve straight away with the bread.'],
    photoAlt:'Scrambled eggs with pieces of tomato on a plate, slices of bread beside them' },
  'owsianka-wodna':{ name:'Banana porridge made with water', steps:[
    'Cover the oats with the water and cook for 5–7 minutes, stirring.',
    'Mash one banana with a fork and stir it into the oats.',
    'Slice the other banana. Arrange on the porridge and sprinkle with cinnamon.'],
    photoAlt:'A bowl of porridge with banana slices sprinkled with cinnamon' },
  'pasta-jajeczna':{ name:'Egg and chive spread on bread', steps:[
    'Put the eggs in a pan of cold water, bring to the boil and cook for 10 minutes from boiling. Rinse with cold water and leave for 5 minutes to cool.',
    'Wash the chives, dry and chop finely. Peel the eggs and mash them with a fork.',
    'Mix the eggs with the yoghurt, chives, salt and pepper. Spread on the slices of bread.'],
    photoAlt:'Slices of bread with egg spread sprinkled with chives' },
  'kasza-manna':{ name:'Semolina pudding with apple purée', steps:[
    'Wash, peel and core the apples and dice them. Stew in a small pan with the water and cinnamon, covered, for 6–8 minutes until soft, then mash with a fork.',
    'In another pan heat the milk with the sugar. When it starts to boil, turn down the heat and pour in the semolina in a thin stream, stirring all the time so no lumps form.',
    'Cook for 2–3 minutes, stirring, until the semolina thickens. Spoon into bowls and top with the apple purée.'],
    photoAlt:'A bowl of semolina pudding topped with apple purée' },
  'twarożek':{ name:'Quark with radishes on bread', steps:[
    'Wash the radishes and chop finely.',
    'Mash the quark with the yoghurt, add the radishes and salt.',
    'Serve on slices of bread.'],
    photoAlt:'Slices of bread with white quark spread and pieces of radish' },
  'jogurt':{ name:'Yoghurt with banana and oats', steps:[
    'Peel the bananas and slice them.',
    'Divide the yoghurt between two bowls.',
    'Add the bananas and oats. Leave for 3 minutes so the oats soften.'],
    photoAlt:'A bowl of plain yoghurt with banana slices and rolled oats' },
  'hummus-kanapki':{ name:'Hummus and cucumber sandwiches', steps:[
    'Wash the cucumber and cut into thin slices.',
    'Spread the bread with hummus.',
    'Arrange the cucumber on the sandwiches and serve.'],
    photoAlt:'Sandwiches with hummus and slices of fresh cucumber' },
  'pasta-z-makreli':{ name:'Smoked mackerel spread with chives', steps:[
    'Remove the skin from the mackerel fillets. Flake the flesh with your fingers and carefully remove all the bones.',
    'Wash the chives and chop finely. Mash the quark with the yoghurt using a fork.',
    'Add the mackerel, chives, lemon juice and pepper and mix. Do not add salt — smoked fish is already salty. Serve on slices of bread.'],
    photoAlt:'Slices of bread with smoked mackerel spread and chives' },
  'koktajl-kefirowy':{ name:'Banana and oat kefir smoothie', steps:[
    'Peel the bananas and break them into pieces.',
    'Put the bananas, oats and cinnamon into a blender and pour in the kefir.',
    'Blend for about a minute until smooth. Pour into two glasses and serve straight away.'],
    photoAlt:'Two glasses of pale banana and kefir smoothie' },
  'pomidorowa':{ name:'Homemade tomato soup with rice', steps:[
    'Peel the onion and carrot. Chop the onion and grate the carrot.',
    'Heat the oil in a saucepan. Fry the vegetables for 4 minutes.',
    'Add the passata, water and salt. Bring to the boil, add the rice and simmer, covered, for about 18 minutes until the rice is tender. Add more water if needed.'],
    photoAlt:'A plate of tomato soup with rice' },
  'kurczak':{ name:'Oven-baked chicken with potatoes', steps:[
    'Heat the oven to 200°C. Peel the potatoes and carrots and cut into small pieces.',
    'Cut the chicken into thick strips. Mix the meat and vegetables with the oil, paprika and salt in a baking dish. Wash your hands and utensils after touching raw meat.',
    'Bake for about 35–40 minutes. Check that the vegetables are soft and that the inside of the thickest piece of meat has reached at least 75°C.'],
    photoAlt:'A baking dish with pieces of chicken, potatoes and carrots' },
  'makaron':{ name:'Pasta in tomato sauce', steps:[
    'Put the water on and cook the pasta according to the packet instructions. Before draining, set aside half a glass of the cooking water.',
    'Meanwhile peel and chop the onion and garlic and fry in the oil for 3 minutes.',
    'Pour in the passata, add salt and simmer for 10 minutes. Combine with the pasta; add some of the cooking water if needed.'],
    photoAlt:'A plate of pasta in red tomato sauce' },
  'soczewica':{ name:'Red lentil stew', steps:[
    'Peel the carrot and onion and dice them. Fry in the oil for 4 minutes.',
    'Rinse the lentils. Add to the pan with the passata, water, paprika and salt.',
    'Simmer for about 20 minutes, stirring, until the lentils are soft. Add more water if needed.'],
    photoAlt:'A bowl of thick red lentil stew with carrot' },
  'placki-ziemniaczane':{ name:'Potato pancakes with sour cream', steps:[
    'Peel and wash the potatoes and onion and grate them finely. Tip into a sieve and press out the excess liquid.',
    'Mix the grated mixture with the egg, flour and salt. Fry straight away so the potatoes do not turn dark.',
    'Heat some of the oil in a frying pan. Add spoonfuls of the mixture, flatten into thin pancakes and fry over a medium heat for 3–4 minutes on each side until golden and cooked through. Repeat with the rest of the mixture, adding more oil.',
    'Drain the pancakes on kitchen paper and serve with the sour cream.'],
    photoAlt:'Golden potato pancakes with a spoonful of sour cream' },
  'leniwe':{ name:'Leniwe — lazy quark dumplings with butter', steps:[
    'Put a large pan of salted water on to boil. Mash the quark thoroughly with a fork, add the egg and mix.',
    'Add about 100 g of the flour and briefly knead into a soft dough. Dust the worktop with the rest of the flour.',
    'Shape two rolls as thick as a thumb, flatten slightly and cut diagonally into pieces about 2 cm long.',
    'Drop the dumplings into the boiling water in batches. Cook for 2–3 minutes after they float to the surface and lift out with a slotted spoon. Pour over the melted butter and sprinkle with sugar.'],
    photoAlt:'A plate of lazy dumplings topped with butter and sprinkled with sugar' },
  'potrawka-z-kurczaka':{ name:'Chicken fricassee with carrots and rice', steps:[
    'Peel the carrots and onion. Chop the onion and cut the carrots into half-moons. Cut the chicken into cubes of about 2 cm. Wash your hands, board and knife after touching raw meat.',
    'Heat the oil in a saucepan. Fry the chicken for 5 minutes, stirring, until white on all sides. Add the onion and carrot and fry for another 3 minutes.',
    'Pour in the water and add the salt and pepper. Simmer, covered, over a low heat for 15 minutes until the carrot is soft. Meanwhile cook the rice according to the packet instructions.',
    'In a mug mix the sour cream with the flour and 3 tablespoons of the hot sauce, pour into the pan and cook for 2 minutes, stirring, until the sauce thickens. Check that the inside of the thickest piece of meat has reached at least 75°C and serve with the rice.'],
    photoAlt:'A plate of rice with pieces of chicken and carrot in a pale sauce' },
  'salatka':{ name:'Chickpea salad', steps:[
    'Wash the vegetables, deseed the pepper and dice everything.',
    'Rinse and drain the chickpeas. Combine with the vegetables.',
    'Whisk the oil with the lemon juice and salt. Pour over the salad and mix.'],
    photoAlt:'A bowl of salad with chickpeas, tomato, cucumber and pepper' },
  'omlet':{ name:'Pepper omelette', steps:[
    'Wash the pepper, remove the seeds and cut into small dice.',
    'Fry the pepper in the oil for 4 minutes. Beat the eggs with the salt.',
    'Pour the eggs into the pan. Cook, covered, over a low heat for about 6 minutes until the eggs are completely set.'],
    photoAlt:'An omelette with diced pepper on a plate' },
  'grzanki':{ name:'Warm tomato toasts', steps:[
    'Heat the oven to 190°C. Wash the tomatoes and cut into small dice.',
    'Drizzle the bread with oil, rub with a peeled garlic clove and place on a baking tray.',
    'Top with the tomatoes, sprinkle with salt and bake for 8–10 minutes.'],
    photoAlt:'Baked slices of bread topped with diced tomato' },
  'kasza-z-jajkiem':{ name:'Buckwheat with a fried egg and onion', steps:[
    'Cook the buckwheat with half the salt according to the packet instructions, usually about 15 minutes.',
    'Meanwhile peel and dice the onion. Heat half the butter in a frying pan and fry the onion over a medium heat for 5–6 minutes until golden. Stir it into the cooked buckwheat.',
    'Heat the rest of the butter in the same pan. Crack in the eggs, add the rest of the salt and the pepper. Fry, covered, for 3–4 minutes until the white and yolk are set. Place the eggs on the buckwheat.'],
    photoAlt:'A plate of buckwheat with fried onion and a fried egg' },
  'ziemniaki-z-gzikiem':{ name:'Potatoes in their jackets with gzik (quark, radish & chive spread)', steps:[
    'Choose potatoes of a similar size and scrub them well. Put them in their skins into a pan, cover with cold water with half the salt and cook for 20–25 minutes from boiling, until a knife goes in easily.',
    'Meanwhile wash the radishes and chives and chop finely. Mash the quark with the sour cream using a fork, add the radishes, chives and the rest of the salt.',
    'Drain the potatoes and let them steam dry in the pan for a minute. Serve hot, in their skins or peeled, with the gzik on the side.'],
    photoAlt:'Potatoes in their skins next to a bowl of quark with chives and radish' },
  'placuszki':{ name:'Banana pancakes', steps:[
    'Mash the bananas. Mix with the eggs, milk and flour.',
    'Heat some of the oil in a frying pan and add spoonfuls of the batter.',
    'Fry the small pancakes over a medium heat for 2–3 minutes on each side until set in the middle. Repeat with the rest of the batter.'],
    photoAlt:'A stack of small banana pancakes on a plate' },
  'pieczone-jablka':{ name:'Baked apples with cinnamon', steps:[
    'Heat the oven to 180°C. Wash the apples and scoop out the cores.',
    'Stand them in a dish and fill the centres with the sugar and cinnamon. Pour the water into the bottom of the dish.',
    'Bake for about 25 minutes until soft. Leave to cool slightly before serving.'],
    photoAlt:'Two baked apples with cinnamon in a baking dish' },
  'kakao':{ name:'Banana and cocoa cream', steps:[
    'Peel the ripe bananas and cut them up.',
    'Blend with the cocoa into a smooth cream or mash very thoroughly with a fork.',
    'Divide between bowls and serve straight away.'],
    photoAlt:'A bowl of dark banana and cocoa cream' },
  'nalesniki-z-twarogiem':{ name:'Sweet crêpes with quark', steps:[
    'Whisk the flour, milk, water, egg and a spoonful of the oil into a smooth, lump-free batter. Leave for 10 minutes.',
    'Mash the quark with the yoghurt and sugar into a smooth cream using a fork.',
    'Heat a frying pan and brush it thinly with oil. Pour in a portion of batter, spread it over the base and cook for about a minute on each side until set and lightly browned. Make about 6 crêpes this way.',
    'Spread each crêpe with the quark cream and roll it up.'],
    photoAlt:'Rolled crêpes with a white quark filling on a plate' },
  'marchewki':{ name:'Carrot sticks with a yoghurt dip', steps:[
    'Peel and wash the carrots and cut them into sticks.',
    'Peel the garlic and grate it finely. Mix with the yoghurt and salt.',
    'Serve the carrots with the dip in a separate bowl.'],
    photoAlt:'Sticks of raw carrot next to a bowl of yoghurt dip' },
  'pasta-fasolowa':{ name:'Homemade white bean dip', steps:[
    'Rinse and drain the beans. Peel the garlic.',
    'Blend the beans with the oil, lemon juice, garlic and salt. If the dip is too thick, add a spoonful of water.',
    'Peel and wash the carrots and cut them into sticks. Serve the dip with the carrots.'],
    photoAlt:'A bowl of pale white bean dip with carrot sticks' },
  'surowka-z-marchewki':{ name:'Carrot and apple slaw', steps:[
    'Peel and wash the carrots. Wash the apple and remove the core.',
    'Grate the carrots and apple coarsely. Sprinkle straight away with lemon juice so the apple does not turn brown.',
    'Add the oil and sugar, mix and serve straight away.'],
    photoAlt:'A bowl of grated carrot and apple slaw' },
  'mizeria':{ name:'Mizeria — cucumber salad with yoghurt and dill', steps:[
    'Wash and peel the cucumber and cut into thin slices. Salt, mix and leave for 5 minutes to release its juice.',
    'Wash the dill, dry and chop finely. Pour off the cucumber juice.',
    'Mix the cucumber with the yoghurt, dill and pepper. Serve straight away.'],
    photoAlt:'A bowl of cucumber slices in yoghurt with dill' },
  // Added in CNT-023.
  'chleb-w-jajku':{ name:'Eggy bread with chives', steps:[
    'In a deep plate beat the eggs with the milk and salt using a fork. Wash the chives and chop finely.',
    'Dip the slices of bread one by one in the egg mixture, turning them so they soak on both sides.',
    'Heat the butter in a frying pan. Fry the slices over a medium heat for 2–3 minutes on each side until the egg is completely set and browned. Sprinkle with the chives.'],
    photoAlt:'Golden slices of bread fried in egg, sprinkled with chives' },
  'kanapki-z-jajkiem-i-rzodkiewka':{ name:'Hard-boiled egg and radish sandwiches', steps:[
    'Put the eggs in a pan of cold water, bring to the boil and cook for 10 minutes from boiling. Rinse with cold water and leave for 5 minutes.',
    'Wash the radishes and slice thinly. Wash and chop the chives. Peel the eggs and slice them.',
    'Butter the bread, top with the slices of egg and radish, sprinkle with salt and the chives.'],
    photoAlt:'Sandwiches with slices of hard-boiled egg and radish' },
  'ryz-na-mleku':{ name:'Rice pudding with apple and cinnamon', steps:[
    'Rinse the rice in a sieve. Put it in a small pan, cover with the water and cook, covered, over a low heat for about 10 minutes until the water is absorbed.',
    'Pour in the milk, add the sugar and cook uncovered for 12–15 minutes, stirring often so the rice does not stick to the bottom.',
    'Wash the apple, remove the core and grate it coarsely. Stir into the rice with the cinnamon and heat for another 2 minutes.'],
    photoAlt:'A bowl of creamy rice pudding with grated apple' },
  'strammer-max':{ name:'Strammer Max — bread with ham and a fried egg', steps:[
    'Thinly spread the slices of bread with half the butter and lay the slices of ham on top. Wash and chop the chives.',
    'Heat the rest of the butter in a frying pan. Crack in the eggs and fry, covered, over a low heat for 3–4 minutes until the white and yolk are set.',
    'Put one fried egg on each sandwich. Season with pepper and sprinkle with the chives.'],
    photoAlt:'A slice of bread with ham topped with a fried egg' },
  'tamagoyaki':{ name:'Tamagoyaki — Japanese rolled omelette', steps:[
    'Beat the eggs in a bowl with the water, soy sauce and sugar until the sugar dissolves.',
    'Heat a frying pan over a medium heat and brush it thinly with oil. Pour in a third of the mixture. When it sets, roll it up with a spatula and push it to the edge of the pan.',
    'Oil the free part of the pan and pour in another portion of the mixture so that it flows under the roll. When set, roll it around the first roll. Repeat with the rest of the mixture.',
    'Cook the finished roll for another minute, turning, until there is no runny egg inside. Leave for 2 minutes and cut into thick slices.'],
    photoAlt:'Slices of rolled yellow omelette on a small plate' },
  'omlet-francuski':{ name:'French omelette with cheese', steps:[
    'Grate the cheese. Wash and chop the chives. Beat the eggs with the salt using a fork, just until the whites and yolks are combined.',
    'Melt the butter in a frying pan over a medium heat. Pour in the eggs and for the first minute push the setting mixture from the edges to the centre with a spatula.',
    'When the top is no longer runny, sprinkle the omelette with the cheese, fold it in half and cook for another minute until the cheese melts and the eggs are completely set. Sprinkle with the chives.'],
    photoAlt:'A pale omelette folded in half with melted cheese inside' },
  'kanapki-z-serem-i-pomidorem':{ name:'Cheese and tomato sandwiches', steps:[
    'Wash the tomato and slice it. Wash and chop the chives.',
    'Butter the slices of bread and lay the slices of cheese on top.',
    'Put the tomato slices on the cheese and sprinkle with the chives. If the sandwiches are to wait, pack the tomato separately.'],
    photoAlt:'Sandwiches with slices of hard cheese and tomato' },
  'twarozek-z-bananem':{ name:'Sweet quark with banana', steps:[
    'Mash the quark with the yoghurt into a smooth cream using a fork.',
    'Peel and mash one banana and stir it into the quark.',
    'Slice the other banana. Spoon the quark into bowls, arrange the banana slices on top and sprinkle with cinnamon.'],
    photoAlt:'A bowl of white quark with banana slices and cinnamon' },
  'onigiri-z-tunczykiem':{ name:'Tuna onigiri (rice balls)', steps:[
    'Rinse the rice in a sieve under cold water until the water runs almost clear. Bring it to the boil in the measured water, turn the heat down to the minimum and cook, covered, for 12 minutes. Take off the heat and leave covered for 5 minutes.',
    'Flake the tuna with a fork and mix with the soy sauce. Cut the nori sheet into 4 strips with scissors.',
    'Mix the rice with the salt and let it cool for about 5 minutes so you can hold it in your hands. Wet your hands, take a quarter of the rice, make a hollow, put in a teaspoon of tuna and press the rice into a firm triangle.',
    'Shape 4 onigiri this way and wrap the base of each with a strip of nori. Eat the same day and keep in the fridge until then.'],
    photoAlt:'Triangular rice balls wrapped in strips of nori' },
  'croque-monsieur':{ name:'Pan-fried croque-monsieur', steps:[
    'Slice or grate the cheese. Butter all the slices of bread on one side.',
    'Place two slices butter side down and top with half the cheese, the ham and the rest of the cheese. Cover with the other slices, butter side up.',
    'Fry the sandwiches in a dry frying pan over a low heat for 3–4 minutes on each side, pressing lightly with a spatula, until the bread is browned and the cheese has melted. Cut in half.'],
    photoAlt:'A golden toasted sandwich with ham and melting cheese' },
  'salatka-makaronowa':{ name:'Pasta salad with mozzarella and tomatoes', steps:[
    'Cook the pasta according to the packet instructions. Drain, rinse with cold water and drain well.',
    'Wash and dice the tomatoes. Drain the mozzarella and dice it. Rinse the basil leaves and tear them.',
    'Mix the pasta with the tomatoes, mozzarella, basil, olive oil and salt. Serve straight away or put in a box and keep in the fridge.'],
    photoAlt:'A bowl of pasta with diced tomato, mozzarella and basil leaves' },
  'zupa-ziemniaczana':{ name:'Potato soup with dill', steps:[
    'Peel and wash the potatoes, carrot and onion. Cut the potatoes into cubes of about 1.5 cm and the carrot into half-moons, and chop the onion.',
    'Melt the butter in a saucepan and fry the onion with the carrot for 3 minutes. Add the potatoes, water, salt and pepper. Simmer, covered, for about 15 minutes until the potatoes are soft.',
    'Mash some of the potatoes in the pan with a masher or fork to thicken the soup. In a mug mix the sour cream with 3 tablespoons of the hot soup and pour into the pan.',
    'Wash and chop the dill and add to the soup. Heat for a minute without letting it boil.'],
    photoAlt:'A plate of pale potato soup with carrot and dill' },
  'makaron-z-twarogiem':{ name:'Pasta with quark and butter', steps:[
    'Cook the pasta in salted water according to the packet instructions and drain.',
    'Put the butter in the empty, still warm pan and when it melts, tip the pasta back in and mix.',
    'Crumble the quark with your fingers or a fork. Divide the pasta between plates and sprinkle with the quark and sugar.'],
    photoAlt:'A plate of pasta sprinkled with crumbled white quark' },
  'jajka-w-sosie-koperkowym':{ name:'Eggs in dill sauce with potatoes', steps:[
    'Peel, wash and halve the potatoes and cook in water with half the salt for about 20 minutes until soft. In another pan cover the eggs with cold water, bring to the boil and cook for 10 minutes from boiling, then rinse with cold water.',
    'Melt the butter in a small pan, add the flour and stir for a minute. Pour in the milk a little at a time, whisking all the time, and cook for 3 minutes until the sauce thickens.',
    'Wash and chop the dill. Add to the sauce with the rest of the salt. Peel the eggs and cut them in half.',
    'Drain the potatoes, divide between plates, put the eggs next to them and pour the sauce over the eggs.'],
    photoAlt:'Egg halves in a pale green dill sauce next to boiled potatoes' },
  'spaghetti-aglio-e-olio':{ name:'Spaghetti aglio e olio (garlic and olive oil)', steps:[
    'Cook the pasta in salted water according to the packet instructions. Before draining, set aside half a glass of the cooking water.',
    'Meanwhile peel the garlic and slice it thinly. Wash and chop the parsley. In a large frying pan heat the olive oil with the garlic over a low heat for 3–4 minutes until the garlic is lightly golden. Do not let it brown or it will turn bitter.',
    'Transfer the pasta to the pan, add 4 tablespoons of the reserved water and toss over the heat for a minute until the oil coats the pasta. Add the parsley and pepper.'],
    photoAlt:'A plate of spaghetti with slices of garlic and chopped parsley' },
  'makaron-z-tunczykiem':{ name:'Pasta with tuna and tomatoes', steps:[
    'Put the water on and cook the pasta according to the packet instructions.',
    'Meanwhile peel and chop the onion and garlic. Fry them in the olive oil for 3 minutes, pour in the passata, add salt and simmer over a low heat for 8 minutes.',
    'Flake the tuna with a fork, add to the sauce and heat for 2 minutes. Mix the sauce with the drained pasta.'],
    photoAlt:'A plate of pasta in tomato sauce with pieces of tuna' },
  'frykadele':{ name:'Frikadellen (pork patties) with potatoes', steps:[
    'Peel, wash and halve the potatoes and cook in water with some of the salt for about 20 minutes until soft.',
    'Crumble the slice of bread into a bowl and pour over the measured water. Peel the onion and chop very finely. Add the meat, egg, onion, the rest of the salt and the pepper. Mix by hand and shape into 6 flat patties. Wash your hands, the bowl and the board after touching raw meat.',
    'Heat the oil in a frying pan. Fry the patties over a medium heat for 5–6 minutes on each side. Cut one open: the meat inside must not be pink and the juices must run clear.',
    'Serve the patties with the drained potatoes.'],
    photoAlt:'Flat golden-brown meat patties next to boiled potatoes' },
  'ratatouille':{ name:'Quick pan ratatouille', steps:[
    'Wash the vegetables. Cut the courgette and aubergine into cubes of about 1.5 cm. Deseed the pepper and cut it the same way. Peel and chop the onion and garlic.',
    'Heat the olive oil in a large frying pan. Fry the onion with the aubergine for 5 minutes, stirring. Add the pepper and courgette and fry for another 5 minutes.',
    'Add the garlic, passata and salt. Simmer, covered, over a low heat for 12–15 minutes until the vegetables are soft but not mushy.',
    'Serve warm with a slice of bread.'],
    photoAlt:'A pan of courgette, aubergine and pepper stewed in tomato sauce' },
  'oyakodon':{ name:'Oyakodon — rice bowl with chicken and egg', steps:[
    'Rinse the rice in a sieve. Bring it to the boil in 200 ml of the water, turn the heat down to the minimum and cook, covered, for 12 minutes. Leave covered for 5 minutes.',
    'Meanwhile peel the onion and cut it into thin wedges. Cut the chicken into thin strips. Wash your hands, board and knife after touching raw meat.',
    'In a frying pan bring the rest of the water to the boil with the soy sauce and sugar. Add the onion and chicken and simmer, covered, for 8 minutes until the meat is white inside with no pink.',
    'Beat the eggs with a fork and pour evenly over the chicken. Cook, covered, for 3–4 minutes until the eggs are completely set. Divide the rice between bowls and slide the chicken, egg and sauce on top.'],
    photoAlt:'A bowl of rice topped with chicken, onion and set egg' },
  'yakisoba':{ name:'Yakisoba-style fried noodles with vegetables', steps:[
    'Cook the pasta, ideally thin noodles or spaghetti, one minute less than the packet says. Drain.',
    'Cut the cabbage into thin strips. Peel the carrot and cut into thin sticks. Peel the onion and cut into thin wedges.',
    'Heat the oil in a large frying pan until very hot. Fry the onion and carrot for 3 minutes, add the cabbage and fry for another 4 minutes, stirring. The vegetables should stay slightly crunchy.',
    'Add the pasta, soy sauce and sugar. Fry for 2 minutes, stirring all the time, until the pasta absorbs the sauce.'],
    photoAlt:'A plate of fried noodles with strips of cabbage and carrot' },
  'zapiekanki-z-pieczarkami':{ name:'Baked mushroom and cheese toasts', steps:[
    'Heat the oven to 200°C. Clean the mushrooms and slice them. Peel and chop the onion. Grate the cheese.',
    'Melt the butter in a frying pan. Fry the onion with the mushrooms for 6–7 minutes until their liquid has evaporated. Season with salt and pepper.',
    'Place the slices of bread on a baking tray, spread the mushrooms over them and sprinkle with the cheese. Bake for 8 minutes until the cheese melts and browns.'],
    photoAlt:'Baked slices of bread with mushrooms under melted cheese' },
  'placki-z-cukinii':{ name:'Courgette fritters with a garlic dip', steps:[
    'Wash the courgette and grate it coarsely with the skin on. Mix with half the salt, leave for 5 minutes and squeeze out the juice firmly with your hands.',
    'Peel the garlic, grate it finely and mix with the yoghurt and the rest of the salt. Mix the squeezed courgette with the egg and flour.',
    'Heat some of the oil in a frying pan. Add spoonfuls of the mixture, flatten and fry over a medium heat for 3 minutes on each side until the fritters are golden and cooked through. Repeat with the rest of the mixture and serve with the dip.'],
    photoAlt:'Golden grated courgette fritters next to a bowl of yoghurt dip' },
  'frittata-z-cukinia':{ name:'Courgette frittata', steps:[
    'Wash the courgette and cut into thin half-moons. Peel and chop the onion. Grate the cheese.',
    'Heat the olive oil in a frying pan. Fry the onion with the courgette for 7–8 minutes, stirring, until soft and lightly browned.',
    'Beat the eggs with the salt, pepper and cheese, pour over the vegetables and shake the pan. Cook, covered, over a low heat for about 8 minutes until the top is completely set. Cut into wedges.'],
    photoAlt:'A thick omelette with slices of courgette cut into wedges' },
  'bratkartoffeln':{ name:'Bratkartoffeln (German fried potatoes) with a fried egg', steps:[
    'Peel and wash the potatoes and cut into slices about 3 mm thick. Pat dry with kitchen paper. Peel and dice the onion.',
    'Heat most of the oil in a large frying pan. Spread the potatoes out as flat as possible and fry over a medium heat for 15 minutes, turning every few minutes. Add the onion and salt and fry for another 5 minutes until the potatoes are soft and golden.',
    'Push the potatoes to the side or use a second pan. Fry the eggs in the rest of the oil, covered, for 3–4 minutes until the white and yolk are set.',
    'Divide the potatoes between plates, put the eggs on top, season with pepper and sprinkle with chopped chives.'],
    photoAlt:'Golden slices of fried potato with onion and a fried egg on top' },
  'flammkuchen':{ name:'Flammkuchen-style flatbread with onion and sour cream', steps:[
    'Heat the oven to 250°C with the baking tray inside. Mix the flour with half the salt, the water and oil, then knead for 3 minutes into a smooth dough.',
    'Peel the onion and cut into very thin half-moons. Roll out the dough on a sheet of baking paper into a thin base, roughly the size of the tray.',
    'Spread the base with the sour cream, leaving a narrow border. Scatter over the onion and sprinkle with the rest of the salt and the pepper.',
    'Slide the base on its paper onto the hot tray and bake for 10–12 minutes until the edges are golden and crisp. Sprinkle with chopped chives.'],
    photoAlt:'A thin crisp flatbread with sour cream, onion and chives' },
  'salatka-nicejska':{ name:'Niçoise salad with tuna', steps:[
    'Peel and wash the potatoes, cut into large cubes and cook in salted water for about 15 minutes until soft. In another pan cover the eggs with cold water, bring to the boil and cook for 10 minutes from boiling.',
    'Drain the potatoes and let them cool. Rinse the eggs with cold water, peel and cut into quarters. Wash the tomatoes and cucumber and cut into wedges.',
    'Mix the olive oil with the lemon juice and salt. Arrange the potatoes, tomatoes and cucumber on plates, top with pieces of tuna and egg, and pour over the dressing.'],
    photoAlt:'A plate of salad with potatoes, tuna, egg quarters and tomato' },
  'zupa-miso':{ name:'Simple miso soup with tofu', steps:[
    'Peel the carrot and cut into very thin half-moons. Bring the water to the boil, add the carrot and cook for 5 minutes.',
    'Cut the tofu into cubes of about 1 cm. Cut the nori into thin strips with scissors. Wash and chop the chives. Add the tofu to the pan and heat for 2 minutes.',
    'Take the pan off the heat. Mix the miso paste in a mug with a few spoonfuls of the hot broth and pour into the soup. Do not boil it again, so it keeps its flavour.',
    'Ladle the soup into bowls and add the nori strips and chives.'],
    photoAlt:'A bowl of cloudy miso soup with tofu cubes and strips of nori' },
  'omurice':{ name:'Omurice — omelette over tomato rice', steps:[
    'Cook the rice according to the packet instructions. Meanwhile peel the onion and carrot and cut into small dice.',
    'Melt half the butter in a frying pan. Fry the onion with the carrot for 5 minutes. Add the rice, passata and half the salt and fry for 3 minutes, stirring, until the rice is coloured. Divide the rice between two plates and shape into oval mounds.',
    'Wipe the pan. Beat 2 eggs with a pinch of salt and cook a thin omelette in half the remaining butter, 2–3 minutes covered, until completely set. Lay it over one mound of rice.',
    'Cook the second omelette the same way from the remaining eggs and butter and lay it over the second portion.'],
    photoAlt:'An oval mound of tomato rice covered with a thin yellow omelette' },
  'racuszki-z-jablkami':{ name:'Apple pancakes without yeast', steps:[
    'Whisk the flour, milk, egg and half the sugar into a thick, smooth batter.',
    'Wash, peel and core the apples and cut into small dice. Stir them into the batter.',
    'Heat some of the oil in a frying pan. Add spoonfuls of the batter and fry over a medium heat for 2–3 minutes on each side until the pancakes are golden and cooked through. Repeat with the rest of the batter.',
    'Mix the rest of the sugar with the cinnamon and sprinkle over the warm pancakes.'],
    photoAlt:'A plate of small pancakes with pieces of apple sprinkled with cinnamon sugar' },
  'budyn-kakaowy':{ name:'Homemade chocolate pudding', steps:[
    'Pour half a glass of the cold milk into a mug and stir the potato starch and cocoa into it thoroughly so there are no lumps.',
    'Bring the rest of the milk to the boil with the sugar in a small pan. Turn down the heat and pour in the mixture from the mug in a thin stream, whisking vigorously.',
    'Cook for a minute, stirring all the time, until the pudding thickens and starts to bubble. Pour into bowls and serve warm or chilled.'],
    photoAlt:'Two bowls of thick dark chocolate pudding' },
  'omlet-biszkoptowy':{ name:'Fluffy sweet omelette with mixed berries', steps:[
    'Put the frozen berries in a small pan with half the sugar. Bring to the boil and cook for 2 minutes, stirring, then set aside.',
    'Separate the whites from the yolks. Whisk the whites with a whisk or mixer to stiff peaks, adding the rest of the sugar towards the end. Gently fold in the yolks, then the flour.',
    'Melt the butter in a frying pan, add the mixture and level it. Cook, covered, over a low heat for 5–6 minutes until the top is set. Turn the omelette over with the help of a plate and cook for another 2 minutes.',
    'Slide the omelette onto a plate, pour over the warm berries and cut in half.'],
    photoAlt:'A fluffy pale omelette topped with a dark red berry sauce' },
  'rote-grutze':{ name:'Rote Grütze — red berry pudding with yoghurt', steps:[
    'In a mug stir the potato starch into 4 tablespoons of the measured cold water.',
    'Put the frozen berries in a small pan and add the rest of the water and the sugar. Bring to the boil and cook for 3 minutes.',
    'Pour in the starch mixture, stirring all the time, and cook for another minute until the pudding thickens and turns glossy.',
    'Pour into bowls and leave to cool for at least 5 minutes. Serve with a spoonful of yoghurt on top.'],
    photoAlt:'A bowl of thick red berry dessert with a dollop of yoghurt' },
  'tosty-francuskie':{ name:'French toast with cinnamon', steps:[
    'In a deep plate beat the eggs with the milk, half the sugar and the cinnamon.',
    'Soak the slices of bread, ideally a day old, in the mixture for about 20 seconds on each side so they absorb it well.',
    'Melt the butter in a frying pan. Fry the slices over a medium heat for 2–3 minutes on each side until golden and the egg mixture is completely set. Sprinkle with the rest of the sugar.'],
    photoAlt:'Golden sweet French toast sprinkled with sugar' },
  'macedonia':{ name:'Macedonia — Italian fruit salad', steps:[
    'Peel one orange and dice it. Squeeze the juice of the other into a bowl, add the lemon juice and sugar and mix.',
    'Wash the apple, remove the core and dice it. Peel the banana and slice it. Put the fruit straight into the juice so it does not turn brown.',
    'Add the diced orange, mix and leave for 5 minutes for the fruit to release its juice. Serve in bowls with the juice.'],
    photoAlt:'A bowl of chopped orange, apple and banana in juice' },
  'surowka-z-kapusty':{ name:'White cabbage and carrot slaw', steps:[
    'Shred the cabbage into strips as thin as possible. Sprinkle with salt and knead with your hand for 2 minutes until it softens and releases its juice.',
    'Peel the carrot and grate it coarsely. Wash and chop the dill.',
    'Mix the cabbage with the carrot, dill, lemon juice, oil and sugar. Leave for 5 minutes before serving.'],
    photoAlt:'A bowl of shredded white cabbage and carrot slaw' },
  'caprese':{ name:'Caprese salad', steps:[
    'Wash the tomatoes and slice them. Drain the mozzarella and cut into slices of a similar thickness.',
    'Arrange the tomato and mozzarella slices alternately on a plate.',
    'Rinse the basil leaves and scatter on top. Drizzle with olive oil and season with salt and pepper just before serving.'],
    photoAlt:'Alternating slices of tomato and mozzarella with basil leaves' },
  'bruschetta':{ name:'Bruschetta with tomatoes and basil', steps:[
    'Wash the tomatoes, remove the seeds and cut the flesh into small dice. Rinse and tear the basil leaves. Mix the tomatoes with the basil, salt and half the olive oil.',
    'Toast the slices of bread in a dry frying pan for 2 minutes on each side until crisp.',
    'Rub the hot toasts with a halved garlic clove and drizzle with the rest of the olive oil. Add the tomatoes just before serving so the bread does not go soggy.'],
    photoAlt:'Crisp toasts with raw tomatoes and basil' },
  'kartoffelsalat':{ name:'Kartoffelsalat — German potato salad', steps:[
    'Peel and wash the potatoes and cut into slices about 5 mm thick. Cook in salted water for 10–12 minutes until soft but not falling apart. Drain carefully.',
    'Peel the onion and chop finely. In a small pan bring the measured water to the boil with the onion, vinegar, sugar, salt and pepper and boil for 2 minutes.',
    'Pour the hot dressing over the warm potatoes, add the oil and mix gently. Leave for 10 minutes for the potatoes to absorb the liquid.',
    'Wash and chop the chives and stir into the salad. Serve lukewarm.'],
    photoAlt:'A bowl of sliced potato salad with onion and chives, without mayonnaise' },
  'zupa-cebulowa':{ name:'Onion soup with a cheese toast', steps:[
    'Peel the onions and cut into thin half-moons. Melt the butter in a saucepan and fry the onion with the salt over a medium heat for 12–15 minutes, stirring often, until soft and golden brown.',
    'Dust the onion with the flour and stir for a minute. Pour in the water, season with pepper and simmer, covered, for 8 minutes.',
    'Meanwhile grate the cheese. Toast the slices of bread in a dry frying pan for 2 minutes on one side, turn over, sprinkle with the cheese and cover for 2 minutes until the cheese melts.',
    'Ladle the soup into bowls and put a cheese toast on each.'],
    photoAlt:'A bowl of brown onion soup with a toast under melted cheese' },
  'sunomono':{ name:'Sunomono — cucumber salad with sesame', steps:[
    'Wash the cucumber and cut into slices as thin as possible. Salt, mix and leave for 5 minutes, then squeeze with your hands and pour off the juice.',
    'Toast the sesame seeds in a dry frying pan for 1–2 minutes, stirring, until fragrant and lightly golden.',
    'Mix the vinegar with the sugar and soy sauce until the sugar dissolves. Pour over the cucumber, mix and sprinkle with the sesame seeds.'],
    photoAlt:'A bowl of thin cucumber slices in dressing, sprinkled with sesame' },
};
