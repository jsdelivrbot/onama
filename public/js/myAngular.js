(function() {
  //var app = angular.module('app', []);
  var app = angular.module('app', ['ngCookies'], function($httpProvider) {
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
    for(name in obj) {
    value = obj[name];
    if(value instanceof Array) {
      for(i=0; i<value.length; ++i) {
        subValue = value[i];
        fullSubName = name + '[' + i + ']';
        innerObj = {};
        innerObj[fullSubName] = subValue;
        query += param(innerObj) + '&';
      }
    }
    else if(value instanceof Object) {
      for(subName in value) {
        subValue = value[subName];
        fullSubName = name + '[' + subName + ']';
        innerObj = {};
        innerObj[fullSubName] = subValue;
        query += param(innerObj) + '&';
      }
    }
    else if(value !== undefined && value !== null)
      query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
    return query.length ? query.substr(0, query.length - 1) : query;
    };
    $httpProvider.defaults.transformRequest = [function(data) {
      return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
    }];
  });

  var chargement = 0;
  var user = {};
  var food = {};
  var recipes = [];
  var recipe = {};
  var types = {};
  var difficulties = {};
  var origins = {};
  var modalRecipe = null;

  var connected = function(){
    return('id_user' in user);
  }

  //Verifie si l'aliment et renvoie l'id
  var existingFood = function(title_food){
    var existing = 0;
    for(var i = 0; i < food.length; i++){
      if(food[i].title_food == title_food){
        existing = food[i].id_food;
      }
    }
    return existing;
  }



  //Obtenir la quantite d'un aliment de l'utilisateur
  var getQuantity = function(id_food){
    var res = 0;
    for(var i = 0; i < user.food.length; i++){
      if(user.food[i].id_food == id_food){
        res = user.food[i].quantity_getfood;
      }
    }
    return res;
  }

  //Modifie la quantité de l'aliment de l'user
  var setQuantity = function(id_food, quantity){
    var find = false;
    for(var i =0; i < user.food.length; i++){
      if(user.food[i].id_food == id_food){
        user.food[i].quantity_getfood = quantity;
        find = true;
      }
    }
    if(!find){
      user.food.push({id_food: id_food, quantity_getfood: quantity, title_food: findTitle_food(id_food)});
    }
  }

  //recuperation des aliments de l'user
  var getFood = function(id_user, $http){
    $http.get('/user/myfood',{params: {id_user: id_user}})
    .then(function(response){
      user.food = response.data;
    });
  }

  //Recuperation des recettes de l'utilisateur
  var getRecipes = function(id_user, $http){
    $http.get('/user/myRecipes',{params: {id_user: id_user}})
    .then(function(response){
      user.recipes = response.data;
    });
  }

  //Initialiser le cookie stayconnected
  var initStayConnected = function(data, $cookies){
    if(data.stayconnected){ //Cookie 7 jours
      var expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 7);
      $cookies.put('cookiecode', data.cookiecode, {"expires" : expireDate} );
    }
    else { //Cookie 20min
      var expireDate = new Date();
      expireDate.setMinutes(expireDate.getMinutes() + 20);
      $cookies.put('cookiecode', data.cookiecode, {"expires" : expireDate} );
    }
  }

  //trouver le nom d'un aliment
  var findTitle_food = function(id_food){
    for(var i = 0; i < food.length; i++){
      if(food[i].id_food == id_food){
        return food[i].title_food;
      }
    }
    return "";
  }

  //Supprimer aliment de chez l'ulisateur
  var deleteFood = function(id_food){
    for(var i = 0; i < user.food.length; i++){
      if(user.food[i].id_food == id_food){
        user.food.splice(i, 1);
      }
    }
  }

  //Obtenir les favoris
  var getFavoritesRecipes = function($http){
    while(!recipes){}
    $http.get("/recipes/getFavorites",{params:{id_user: user.id_user}}).then(function(response){
      if("error" in response.data){
        Materialize.toast(response.data.error, 3000);
      }
      else {
        user.favorites = response.data;
      }
    });
  }


  //Se connecter
  var connection = function(response,$http,$cookies){
    if("error" in response.data){
      Materialize.toast(response.data.error, 3000);
    }
    else {
      user = response.data;
      initStayConnected(response.data, $cookies);
      getFood(user.id_user, $http);
      getRecipes(user.id_user, $http);
      getFavoritesRecipes($http);
      Materialize.toast("Connecté.", 3000);
    }
    chargement--;
  }

//Bloque les collapsible sur la fonction
var blockCollapsible = function(){
  $('.collapsible').collapsible('destroy');
  setTimeout(function(){ $('.collapsible').collapsible(); }, 50);
}

//Indique si une recette est favorite
var isFavorite = function(id_recipe){
  if(user.favorites && user.favorites.indexOf(id_recipe) >= 0){
    return 'favorite';
  }
  else{
    return 'favorite_border';
  }
}

//change la valeur du favoris pour une recette
var changeFavorite = function(id_recipe, $http){
  blockCollapsible();
  if(connected()){
    $http.put('/recipes/changeFavorite', {}, {params:{id_user: user.id_user, id_recipe: id_recipe}}).then(function(response){
      if(response.data.isFavorite){
        user.favorites.push(id_recipe);
      }
      else{
        user.favorites.splice(user.favorites.indexOf(id_recipe),1);
      }
    });
  }
  else{
    Materialize.toast("Veuillez vous connecter pour enregistrer des favoris.",3000);
  }
}

//Envoie une recette dans la page recette apres avoir cliquer sur details
var makeShowRecipe = function(id_recipe,$http){
  blockCollapsible();
  setTimeout(function(){
    $('html, body').animate({
      scrollTop:$('#recipe').offset().top
    }, 'slow');
  },50);
  recipe.id_recipe = id_recipe;
  $http.get("/recipes/getOne",{params: {id_recipe: id_recipe}}).then(function(response){
    if("error" in response.data){
      Materialize.toast(response.data.error, 2000);
    }
    else{
      var rows = response.data;
      var instructions = [];
      var food = [];
      var id_food_Arr = [];
      var title_food_Arr = [];
      var quantity_containfood_Arr = [];
      var row = {};
      var price = 0;
      var calorie = 0;
      var proteins = 0;
      var lipids = 0;
      var carbohydrates = 0;
      var quantityTotal = 0;

      rows.forEach(function(row){
        if(instructions.indexOf(row.title_instruction) == -1){
          instructions.push(row.title_instruction);
        }
        if(title_food_Arr.indexOf(row.title_food) == -1){
          id_food_Arr.push(row.id_food);
          title_food_Arr.push(row.title_food);
          quantity_containfood_Arr.push(row.quantity_containfood);
          price += row.price*row.quantity_containfood/1000;
          calorie += row.calorie*row.quantity_containfood/100;
          proteins += row.proteins*row.quantity_containfood/100;
          lipids += row.lipids*row.quantity_containfood/100;
          carbohydrates += row.carbohydrates*row.quantity_containfood/100;
          quantityTotal += row.quantity_containfood;
        }
      });

      for(var i = 0; i < title_food_Arr.length; i++){
        food.push({id_food: id_food_Arr[i], title_food: title_food_Arr[i], quantity_containfood: quantity_containfood_Arr[i]});
      }
      var row1 = rows[0];
      recipe = {
        id_recipe: row1.id_recipe,
        title_recipe: row1.title_recipe,
        time_recipe : row1.time_recipe,
        description: row1.description,
        title_difficulty: row1.title_difficulty,
        popularity: row1.popularity,
        peopleamount: row1.peopleamount,
        imgurl: row1.imgurl,
        title_type: row1.title_type,
        title_origin: row1.title_origin,
        title_difficulty: row1.title_difficulty,
        instructions: instructions,
        food: food,
        price: price,
        calorie: calorie/(quantityTotal/100),
        proteins: proteins/(quantityTotal/100),
        lipids: lipids/(quantityTotal/100),
        carbohydrates: carbohydrates/(quantityTotal/100),
        totalQuantity: quantityTotal,
        totalPeople: row1.peopleamount,
        propPerPers: quantityTotal/row1.peopleamount
      }
    }
  });
}

//setTimeout(function($location){alert($location.url());},1000);


  /*Controllers*/

  app.controller("PageCtrl",["$http", '$cookies', function($http, $cookies){

    this.chargement = function(){
      return (chargement);
    }

    this.connected = function(){
      return connected();
    }

    //Connection si cookie stayconnected
    this.cookie = {cookiecode : $cookies.get('cookiecode')};
    if(this.cookie.cookiecode){
      chargement++;
      $http.post('/connectionCookie', this.cookie)
      .then(function(response){
        connection(response,$http,$cookies);
      });
    }

    //recupere tout les aliments
    chargement++;
   $http.get('/food/all')
    .then(function(response){
      if("error" in response.data){
        Materialize.toast(response.data.error, 2000);
      }
      else {
        food = response.data;
        var data = {};
        var setField = function(element){
          data[element.title_food] = null;
        }
        response.data.forEach(setField);
        $('.autocomplete2').autocomplete({
          data: data,
          limit: 10, // The max amount of results that can be shown at once. Default: Infinity.
          onAutocomplete: function(val) {
            //
          },
          minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
        });
        $('#autocompleteFood').autocomplete({
          data: data,
          limit: 10, // The max amount of results that can be shown at once. Default: Infinity.
          onAutocomplete: function(val) {
            var index = -1;
            for(var i = 0; i < food.length; i++){
              if(food[i].title_food.replace(/ /g, "").toLowerCase() == val.replace(/ /g, "").toLowerCase()){
                index = i;
              }
            }
            if(index == -1){
              Materialize.toast("Erreur.", 3000);
            }
            else {
              //foodCtrl.changePage(Math.trunc(index/50) + 1);
              Materialize.toast("Page : " + (Math.trunc(index/50) + 1) + " aliment : " + (index%50 + 1), 3000);
            }
          },
          minLength: 1, // The minimum length of the input for the autocomplete to start. Default: 1.
        });
      }
      chargement--;
    });

    //Récupérer les caractéristiques de toute les recettes
    chargement++;
    $http.get("/recipes/types").then(function(response){
      types = response.data;
      chargement--;
    });
    chargement++;
    $http.get("/recipes/difficulties").then(function(response){
      difficulties = response.data;
      chargement--;
    });
    chargement++;
    $http.get("/recipes/origins").then(function(response){
      origins = response.data;
      chargement--;
    });

  }]);

  app.controller("ConnectionCtrl",["$http", '$cookies', function($http, $cookies){
    this.connection = {};
    var connectionCtrl = this;

    this.newPassword = function(mailAdress){
      $http.put("user/newPassword", {}, {params:{mailadress: mailAdress}})
      .then(function(response){
        if("error" in response.data){
          Materialize.toast(response.data.error, 2000);
        }
        else{
          Materialize.toast("Un mail a été envoyé à " + response.data.mailadress + ".", 2000);
        }
      });
    }

    // Connection
    this.getConnection = function(){
      chargement++;
      $http.get('/connection', {params: this.connection}).then(function(response){
        connection(response,$http,$cookies);
      });
    }

  }]);

  app.controller("InscriptionCtrl",["$http", '$cookies', function($http, $cookies){
    var inscriptionCtrl = this;
    //Inscription
    this.getInscription = function(valid){
      if(!valid){
        Materialize.toast("Des champs sont vides ou incorrectes.", 3000);
      }
      else if(inscriptionCtrl.inscription.password != inscriptionCtrl.inscription.passwordbis){
        Materialize.toast("Les deux mots de passes ne sont pas identiques.", 3000);
      }
      else{
        chargement++;
        $http.post('/inscription', this.inscription).then(function(response){
          chargement--;
          if("error" in response.data){
            Materialize.toast(response.data.error, 3000);
          }
          else{
            Materialize.toast("Inscrit.", 3000);
            window.scrollTo($('#top').offset().top,0);
            chargement++;
            $http.get('/connection', {params: inscriptionCtrl.inscription}).then(function(response){
              connection(response,$http,$cookies);
            });
          }
        });
      }
    };
  }]);

  app.controller("NavCtrl",["$cookies", function($cookies){

    //deconnection de l'utilisateur
    this.deconnection = function(){
      user = {};
      user.food = {};
      user.recipes = {};
      $cookies.remove("cookiecode");
      Materialize.toast("Déconnecté.", 3000);
    }
  }]);

  app.controller("MyProfileCtrl",["$http", function($http){
    this.editPassword = {};
    var myProfileCtrl = this;

    //Changer le mot de passe
    this.editPassword = function(){
      chargement++;
      var params = this.editpassword;
      params.id_user = user.id_user;
      $http.put('/editPassword', {}, {params: params}).then(function(response){
        chargement--;
        myProfileCtrl.editpassword = {};
        if("error" in response.data){
          Materialize.toast(response.data.error, 2000);
        }
        else {
          Materialize.toast("Mot de passe modifié.", 3000);
        }
      });
    };

    this.getUser = function(){
      return [user];
    }

  }]);

  app.controller("MyFoodCtrl",["$http", function($http){
    this.food = {};
    this.modal = {};
    this.userfood = user.food;
    this.quantity = 0;
    this.idFood = 0;
    this.existingFood = false;
    var myFoodCtrl = this;


    this.userFood = function(){
      return user.food;
    }

    //Initialiser la fenetre modal

    //Indique si un aliment existe et renvoie son id
    this.testFood = function(){
      title_food = this.myFoodAutocomplete
      this.idFood = existingFood(title_food);
      if(this.idFood){
        this.quantity = getQuantity(this.idFood);
        this.existingFood = true;
      }
      else{
        this.existingFood = false;
      }
    }

    this.setModal = function(action,id){
      this.modal.id_food = id;
      this.modal.action = action;
      this.modal.title_food = findTitle_food(id);
      if(action == "Enlever"){
        this.modal.max = getQuantity(id);
      }
      setTimeout(function(){$("#inputModal").select();},50);
    }

    //Modifier quantite d'aliment
    this.updateQuantityFood = function(id_food, action, quantity){
      chargement++;
      var title_food = findTitle_food(id_food);
      var actualQuantity = getQuantity(id_food);
      var id_user = user.id_user;
      switch (action){
        case "Ajouter":
          var newValue = parseInt(actualQuantity) + parseInt(quantity);

          setQuantity(id_food, newValue);
          if(actualQuantity == 0){
            $http.post("user/addFood", {id_user: id_user, id_food: id_food, quantity_getfood: newValue});
          }
          else{
            var data = {id_user: id_user, id_food: id_food, quantity_getfood: newValue};
            $http.put("user/setFood", {}, {params: data}).then(function(response){
            });
          }
          Materialize.toast("Ajouté",1000);
          break;

        case "Enlever":
          var newValue = actualQuantity - quantity;
          if(newValue == 0){
            deleteFood(id_food);
            $http.delete("user/delFood", {params: {id_user: id_user, id_food: id_food}});
          }
          else if(newValue > 0){
            setQuantity(id_food, newValue);
            var data = {id_user: id_user, id_food: id_food, quantity_getfood: newValue};
            $http.put("user/setFood", {}, {params: data});
          }
          else{
            Materialize.toast("Erreur : valeur finale négative.");
          }
          Materialize.toast("Enlevé",1000);
          break;

        case "Initialiser":
          var newValue = quantity;
          setQuantity(id_food, newValue);
          if(actualQuantity == 0)
          {
            $http.post("user/addFood", {id_user: id_user, id_food: id_food, quantity_getfood: newValue});
          }
          else{
            $http.put("user/setFood",{}, {params:{id_user: id_user, id_food: id_food, quantity_getfood: newValue}});
          }
          Materialize.toast("Initilisé",1000);
          break;

        case "Delete":
          deleteFood(id_food);
          $http.delete("user/delFood", {params: {id_user: id_user, id_food: id_food}});
          Materialize.toast("Supprimé",1000);
          break;
      }
      chargement--;
      this.quantity = 0;
      this.myFoodAutocomplete = "";
      $("#autocompleteMyFood").select();
    }

  }]);

  app.controller("FoodCtrl",["$http", function($http){
    this.foodrow1 = {};
    this.foodrow2 = {};
    this.page = 0;
    this.totalPage = [];
    this.food = food;

    var foodCtrl = this;

    this.changePage = function(numpage){
      if(numpage > 0 && numpage <= this.totalPage.length){
        this.page = numpage;
        this.foodrow1 = food.slice((this.page-1)*50, (this.page-1)*50 + 25);
        this.foodrow2 = food.slice((this.page-1)*50+25, (this.page-1)*50 + 50);
      }
    }

    $http.get('/food/all')
    .then(function(response){
      if("error" in response.data){
        Materialize.toast(response.data.error, 2000);
      }
      else {
        foodCtrl.food = response.data;
        for(var i = 0 ; i <= Math.trunc(response.data.length/50); i++){
          foodCtrl.totalPage.push(i + 1);
        }
        foodCtrl.changePage(1);
      }
    });



    this.activePage = function(i){
      return (i == this.page ? "active" : "");
    }

    this.previousPage = function(){
      this.changePage(this.page - 1);
    }
    this.nextPage = function(){
        this.changePage(this.page + 1);
    }

    this.disableLeft = function(){
      return(this.page == 1 ? "disabled" :"");
    }
    this.disableRight = function(){
      return(this.page == this.totalPage.length ? "disabled" : "");
    }

  }]);

  app.controller("RecipesCtrl",["$http", function($http){
    this.recipes = {};
    this.search = {
      show : 0,
      myFood : false
    }
    this.orderBy = "";


    var recipesCtrl = this;

    this.getRecipes = function(){
      return recipes;
    }

    $http.get("/recipes/getAll")
    .then(function(response){
      recipes = response.data;
    });

    this.makeShowRecipe = function(id_recipe){
      makeShowRecipe(id_recipe,$http);
      $http.post("recipes/addView",{id_recipe: id_recipe}).then(function(response){
        if("error" in response.data){
          Materialize.toast(response.data.error, 2000);
        }
      });
    }

    this.findRecipes = function(){
      chargement++;

      //Creation,de requete SQL
      var reqSQL = "";
      var reqSQL1 = "SELECT r.id_recipe, r.title_recipe, min(d.title_difficulty) as difficulty, min(t.title_type) as type, r.time_recipe as time, r.popularity as popularity, r.peopleamount as people, min(o.title_origin) as origin, r.description, r.imgurl";
      var reqSQL3 = " FROM public.recipe r, public.difficulty d, public.origin o, public.type t, public.containfood c, public.food f, public.favorite fa WHERE r.id_difficulty = d.id_difficulty AND r.id_origin = o.id_origin AND r.id_type = t.id_type AND r.id_recipe = c.id_recipe AND c.id_food = f.id_food";
      var search = this.search;

      //Les selects multiples
      var reqSQL4 = ""
      var attributs = ["type", "difficulty", "origin"];
      var numAttribut = 0;
      var multipleSelects = [search.types,search.difficulties,search.origins];
      multipleSelects.forEach(function(select){
        if(select.length != 0){
          reqSQL4 += " AND (1=0";
          select.forEach(function(element){
            reqSQL4 += " OR r.id_" + attributs[numAttribut] + " = " + element;
          });
          reqSQL4 += ")";
        }
        numAttribut ++;
      });

      //Les inputs simples
      var reqSQL5 = "";
      if(search.time){
        reqSQL5 += " AND r.time_recipe <= " + search.time;
      }
      if(search.people){
        reqSQL5 += " AND r.peopleAmount >= " + search.people;
      }

      //Les inputs compliqués (tris)
      var reqSQL2 = "";
      var reqSQL7 = "";
      var reqSQL8 = "";
      var orderByTrad = {"price":"Prix","calorie":"Calories","proteins":"Protéines","lipids":"Lipides","carbohydrates":"Glucides","popularity":"Popularité","time":"Temps","difficulty":"Difficultée"};
      if(search.orderBy){
        this.orderBy = orderByTrad[search.orderBy];
        if(["price","calorie","proteins","lipids","carbohydrates"].indexOf(search.orderBy) != -1){
          reqSQL2 = ",sum(c.quantity_containfood*f." + search.orderBy + ")/sum(c.quantity_containfood) as orderby";
          reqSQL7 += " GROUP BY r.id_recipe ORDER BY orderby";
        }
        else{
          reqSQL7 += " GROUP BY r.id_recipe ORDER BY " + search.orderBy;
        }
        if(search.orderByWay){
          reqSQL8 += " DESC";
        }
      }
      else{
        this.orderBy = "";
        reqSQL7 += " GROUP BY r.id_recipe";
      }

      //Les checkboxs
      var reqSQL6 = "";
      if(connected()){
        if(search.myFood){
          reqSQL6 += " AND r.id_recipe NOT IN (SELECT c.id_recipe FROM public.containfood c, public.getfood g WHERE (c.id_food NOT IN (SELECT id_food FROM public.getfood WHERE id_user = " + user.id_user + ") OR id_user = " + user.id_user + " AND quantity_containfood > quantity_getfood AND c.id_food = g.id_food))";
        }
        if(search.favorites){
          reqSQL6 += " AND fa.id_user = " + user.id_user + " AND fa.id_recipe = r.id_recipe";
        }
      }

      //On met tout ensemble
      reqSQL = reqSQL1 + reqSQL2 + reqSQL3 + reqSQL4 + reqSQL5 + reqSQL6 + reqSQL7 + reqSQL8;

      $http.get("/recipes/find",{params:{reqSQL: reqSQL}}).then(function(response){
        if("error" in response.data){
          Materialize.toast(response.data.error, 2000);
        }
        else{
          recipes = response.data;
          recipesCtrl.search.unity = {"popularity":"vues","time":"min","difficulty":""}[search.orderBy];
          if(["popularity","time","difficulty"].indexOf(search.orderBy) != -1){
            for(var i = 0; i< recipes.length; i++){
              recipes[i].orderby = recipes[i][search.orderBy];
            }
          }
          else{
            recipesCtrl.search.unity = "calorie" == search.orderBy ? "kCal/100g" : "g/100g";
          }
        }
        chargement--;
      });
    }

    this.switchShowSearch = function(){
      this.types = types;
      this.difficulties = difficulties;
      this.origins = origins;
      this.orderByPossibilities = {
        "": "Pas besoin",
        "price": "Prix",
        "popularity": "Popularité",
        "time": "Temps",
        "difficulty": "Difficultée",
        "calorie": "Calories",
        "proteins": "Protéines",
        "lipids": "Lipides",
        "carbohydrates": "Glucides"};
      this.search.show = Math.abs(this.search.show - 1);
      $(document).ready(function() {
        $('select').material_select();
      });
    }

    this.showSearch = function(){
      return this.search.show;
    }

    this.isOrdered = function(){
      return this.orderBy != "";
    }

    this.isFavorite = function(id_recipe){
      if(user.favorites && user.favorites.indexOf(id_recipe) >= 0){
        return 'favorite';
      }
      else{
        return 'favorite_border';
      }
    }

    this.changeFavorite = function(id_recipe){
      changeFavorite(id_recipe,$http);
    }
  }]);

  app.controller("MyRecipesCtrl",["$http", function($http){
    this.buttonType = 'add';
    this.showForm = false;
    this.addRecipe = {submitvalue: "Créer la recette", submiticon: "library_add", food: {}};
    this.food = [];
    this.review = {};
    this.instructions = [];
    this.instruction = "";

    var myRecipesCtrl = this;

    this.userRecipes = function(){
      return user.recipes;
    }
    var myRecipesCtrl = this;

    this.setForm = function(){
      if(this.showForm){
        this.showForm = false;
        this.buttonType = 'add';
      }else {
        this.showForm = true;
        this.buttonType = 'stop';
        this.types = types;
        this.difficulties = difficulties;
        this.origins = origins
      }
    }

    this.existingFood = function(title_food){
      return existingFood(title_food);
    }

    this.addFood = function(foodReview = this.review){
      if(foodReview.title_food && existingFood(foodReview.title_food) && foodReview.quantity_containfood){
        var food = foodReview;
        food.id_food = existingFood(food.title_food);
        this.food.push(food);
        this.review = {};
      }
      else{
        Materialize.toast("Champs incorrectes.",2000);
      }
    }

    this.deleteFood = function (id_food){
      for(var i = 0; i < this.food.length; i++){
        if(this.food[i].id_food == id_food){
          this.food.splice(i,1);
        }
      }
    }

    this.addInstruction = function(){
      if(this.instruction && this.instruction.length <= 120){
        var instruction = this.instruction;
        this.instructions.push(instruction);
        this.instruction = "";
      }
      else{
        Materialize.toast("Champs incorrectes.",2000);
      }
    }

    this.deleteInst = function(instruction){
      for(var i = 0; i < this.instructions.length; i++){
        if(this.instructions[i] == instruction){
          this.instructions.splice(i,1);
        }
      }
    }


    this.createRecipe = function(){
      chargement++;
      if(this.addRecipe.title_recipe
      && this.addRecipe.id_type
      && this.addRecipe.id_origin
      && this.addRecipe.id_difficulty
      && this.addRecipe.peopleamount
      && this.addRecipe.description
      && this.food.length > 0
      && this.instructions.length > 0
      && this.addRecipe.imgurl
      && this.addRecipe.time_recipe > 0){
        var recipe = this.addRecipe;
        recipe.food = this.food;
        recipe.instructions = this.instructions;
        recipe.id_user = user.id_user;
        $http.post("/recipes/add", recipe).then(function(response){
          if("error" in response.data){
            Materialize.toast(response.data.error, 2000);
          }
          else{

            Materialize.toast("Crée.", 2000);
            myRecipesCtrl.addRecipe = {};
            myRecipesCtrl.food = [];
            myRecipesCtrl.review = {};
            myRecipesCtrl.instructions = [];
            myRecipesCtrl.showForm = false;
            myRecipesCtrl.buttonType = 'add';
            user.recipes.push(response.data);
            recipes.push(response.data);
          }
        });
      }
      else {
        Materialize.toast("Champs incorrectes.",2000);
      }
      chargement--;
    }

    this.makeShowRecipe = function(id_recipe){
      makeShowRecipe(id_recipe,$http);
    }

    this.configModal = function(id_recipe){
      modalRecipe = id_recipe;
    }

    this.deleteRecipe = function(){
      alert(modalRecipe);
      for(var i = 0; i < user.recipes.length; i++){
        if(user.recipes[i].id_recipe == modalRecipe){
          user.recipes.splice(i,1);
        }
      }
      for(var i = 0; i < recipes.length; i++){
        if(recipes[i].id_recipe == modalRecipe){
          recipes.splice(i,1);
        }
      }
      $http.delete("/recipes/delete/" + modalRecipe).then(function(response){
        if("error" in response.data){
          Materialize.toast(response.data.error, 2000);
        }
      });
    }
  }]);

  app.controller("RecipeCtrl",["$http", function($http){

    this.page = 1;

    this.showRecipe = function(){

      return ('id_recipe' in recipe);
    }

    this.getRecipe = function(){
      return [recipe];
    }

    this.isFavorite = function(){
      return isFavorite(recipe.id_recipe);
    }

    this.changeFavorite = function(){
      changeFavorite(recipe.id_recipe,$http);
    }

    this.pageIsActive = function(numPage){
      if(numPage == this.page){
        return "active";
      }
    }
    this.hasFood = function(id_food,quantity_containfood){
      var quantity = quantity_containfood*(recipe.totalPeople/recipe.peopleamount);
      if(connected() && user.food){
        for(var i = 0; i < user.food.length; i++){
          if(user.food[i].id_food == id_food && user.food[i].quantity_getfood >= quantity){
            return "active";
          }
        }
      }
    }
    this.selectInst = function(index){
      if(recipe.activatedInst){
        if(recipe.activatedInst.indexOf(index) >= 0){
          recipe.activatedInst.splice(recipe.activatedInst.indexOf(index),1)
        }
        else{
          for(var i = 0; i<= index;i++){
            if(recipe.activatedInst.indexOf(i) < 0){
              recipe.activatedInst.push(i);
            }
          }
        }
      }
      else{
        recipe.activatedInst = [];
        for(var i = 0; i<= index;i++){
            recipe.activatedInst.push(i);
        }
      }
    }
    this.IsactiveInst = function(index){
      if(recipe.activatedInst && recipe.activatedInst.indexOf(index) >= 0){
        return 'active';
      }
    }

    this.getQtyRecipe = function(){
      if(recipe.totalPeople){
        return recipe.totalPeople/recipe.peopleamount;
      }
      else{
        return 1;
      }
    }

    this.rmPeople = function(){
      if(recipe.totalPeople > recipe.peopleamount){
        recipe.totalPeople -= recipe.peopleamount;
      }
    }

    this.addPeople = function(){
      recipe.totalPeople += recipe.peopleamount;
    }

    this.enougthFood = function(){
      var res = true;
      if(recipe.food){

        if(connected()){
          for(var i = 0; i < recipe.food.length; i++){
            var quantityUser = getQuantity(recipe.food[i].id_food);
            var quantityRecipe = recipe.food[i].quantity_containfood*(recipe.totalPeople/recipe.peopleamount);
            if(quantityUser < quantityRecipe){
              res = false
            }
          }
        }
        else{
          res = false;
        }
      }
      if(res){
        this.textEnougthFood = "Vous avez les ingrédients nécessaires pour effectuer " + this.getQtyRecipe() + " fois cette recette.";
        this.iconEnougthFood = "check_circle";
      }
      else{
        this.textEnougthFood = "Vous n'avez pas les ingrédients nécessaires pour effectuer " + this.getQtyRecipe() + " fois cette recette.";
        this.iconEnougthFood = "cancel";
      }
      return res;
    }

    this.recipeDone = function(){
      var foodToDelete = [];
      var foodToDeleteSql = "";
      var newQty = 0;
      for(var i = 0; i < recipe.food.length; i++){
        foodToDelete.push(recipe.food[i]);
        foodToDelete[foodToDelete.length-1].quantity_containfood *= this.getQtyRecipe();
        newQty = getQuantity(recipe.food[i].id_food) - foodToDelete[foodToDelete.length-1].quantity_containfood;
        setQuantity(recipe.food[i].id_food, newQty);
        if(newQty > 0){
          foodToDeleteSql += "UPDATE public.getfood SET quantity_getfood = " + newQty + " WHERE id_food = " + recipe.food[i].id_food + " AND id_user = " + user.id_user + ";";
        }
        else{
          foodToDeleteSql += "DELETE FROM public.getfood WHERE id_food = " + newQty + " AND id_user = " + user.id_user + ";";
        }
      }
      $http.post("/user/deleteFood",{reqSql: foodToDeleteSql})
      .then(function(response){
        if("error" in response.data){
          Materialize.toast(response.data.error, 2000);
        }
      });
    }

  }]);

  app.controller("EnglishCtrl",["$http", function($http){

    this.prevWorldToTrans = "";
    this.prevAnswer = "";
    this.worldToTrans = "Test";
    this.answer = "";
    this.correction = "test2";
    var englishCtrl = this;

    $http.get("/english/all").then(function(response){
      if("error" in response.data){
        Materialize.toast(response.data.error, 2000);
      }
      englishCtrl.worlds = response.data;
    });

    this.getAnswer = function(){
      this.prevWorldToTrans = this.worldToTrans;
      this.prevAnswer = this.answer
      this.worldToTrans = "";
      this.answer = "";
    }




  }]);

})();
