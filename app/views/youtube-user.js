define(['app', 'lodash', 'moment', 'jquery',], function (app, _, moment, $) {

    return ['$document', 'eventGroup', '$location', '$q', '$timeout', '$http', '$scope', function ($document, conference, $location, $q, $timeout, $http, $scope) {
       
        var YOUR_CLIENT_ID = '939849998726-fnr9l2olbposk54lviaegb559v9n1g00.apps.googleusercontent.com';
        var YOUR_REDIRECT_URI = 'http://localhost:2020/youtube-user';
     
        var accessToken;
        /*
        * Create form to request access token from Google's OAuth 2.0 server.
        */
        function oauth2SignIn() {
            // Google's OAuth 2.0 endpoint for requesting an access token
            var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
        
            // Create element to open OAuth 2.0 endpoint in new window.
            var form = document.createElement('form');
            form.setAttribute('method', 'GET'); // Send as a GET request.
            form.setAttribute('action', oauth2Endpoint);
        
            // Parameters to pass to OAuth 2.0 endpoint.
            var params = {'client_id': YOUR_CLIENT_ID,
                        'redirect_uri': YOUR_REDIRECT_URI,
                        'scope': 'https://www.googleapis.com/auth/youtube.force-ssl',
                        'state': 'try_sample_request',
                        'include_granted_scopes': 'true',
                        'response_type': 'token'};
        
            // Add form parameters as hidden input values.
            for (var p in params) {
            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', p);
            input.setAttribute('value', params[p]);
            form.appendChild(input);
            }
        
            // Add form to page and submit it to open the OAuth 2.0 endpoint.
            document.body.appendChild(form);
            form.submit();
        }
    
        async function userInfo(){
            console.log($location.search())
            if (accessToken) {

                const response = await $http.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json',{ 
                                            headers : {
                                                "Authorization" : 'Bearer '+  accessToken
                                            }
                                        });
                $timeout(()=>{
                    // if(response.data.email!= 'cbd'){$scope.googleUser = 'Invalid user '}
                    $scope.googleUser = response.data;
                }, 100)            
            }
            
        }

        function init(){

            var youtubeParams = JSON.parse(sessionStorage.getItem('youtubeParams'))
            if(!youtubeParams?.accessToken){
                const params = new URL(window.location.href.replace('youtube-user#', 'youtube-user?')).searchParams;

                if(params.get('access_token')){
                    accessToken = params.get('access_token');
                    sessionStorage.setItem('youtubeParams', JSON.stringify({accessToken : accessToken}))

                    $location.url('/youtube-user')
                    return;
                }
            }
            else{
                accessToken = youtubeParams.accessToken
            }

            if(!accessToken)
                oauth2SignIn();
            else
                userInfo();
        }
        
        init();
        
  
    }]
});