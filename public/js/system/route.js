$(function () {
    observe('bind', function () {
        function routerMiddleware(){
            notify('start-loading');
            $('section').hide();
            var hash = window.location.hash.slice(2) || 'dashboard';
            if(isNaN(hash[hash.length-1])){
                //$('section[data-route="' + hash + '"]').show();
                notify('build-' + hash);
                //setTimeout(function () {
                    notify('finish-loading');
                //},200);
            }else{
                //must be an edit so it uses the function below
            }
        }
        var routes = {
            '/dashboard': function () {},
            '/about': function () {},
            '/users': function () {},
            '/contact': function () {},
            '/profile': function () {}
        };

        var router  = Router(routes);
        router.configure({
            on:routerMiddleware
        });
        router.init();

        routerMiddleware();
    });

    observe('start-loading', function () {
        $('.loading-page').show();
        $('.whole-page').hide();
    });

    observe('finish-loading', function () {
        $('.loading-page').hide();
        $('.whole-page').show();
    });
});