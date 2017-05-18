(function() {
  var app = angular.module('app', []);

    app.controller("ConnectionCtrl", ["$http", function($http){
      this.connection = {};
      this.getConnection = function(){
        $http.get('/').then(function(data){
          alert(data.toString());
        });
        this.connection = {};
      };
    }]);

    app.controller("InscriptionCtrl", function(){
      this.inscription = {};
      this.getInscription = function(inscription){
        alert(this.inscription.password);
        this.inscription = {};
      };
    });

    app.controller("HomeCtrl", function(){

    });

})();
