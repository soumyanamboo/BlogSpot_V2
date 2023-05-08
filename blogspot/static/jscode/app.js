import login from './components/login.js'
import register_user from './components/register_user.js'
import welcome from './components/welcome.js'
import feeds from './components/feeds.js'
import navigations from './components/navigations.js'
import profile from './components/profile.js'
import add_post from './components/add_post.js'
import update_post from './components/update_post.js'
import search from './components/search.js'
import followers from './components/followers.js'
import following from './components/following.js'
import update_user from './components/update_user.js'
import import_posts from './components/import_posts.js'

const routes = [
    { path: '/',  component: login, name: "login" }, 
    { path: '/register_user',  component: register_user, name: "register_user" }, 
    { path: '/feeds/:userid',  component: feeds, name: "feeds"},
    { path: '/profile/:prof_userid/:prof_username',  component: profile, name: "profile" },     
    { path: '/add_post',  component: add_post, name: "add_post" }, 
    { path: '/update_post/:post_id',  component: update_post, name: "update_post" },
    { path: '/followers/:prof_userid', component: followers, name:'followers' },    
    { path: '/following/:prof_userid', component: following, name:'following' }, 
    { path: '/search', component: search, name:'search' },
    { path: '/update_user/:userid', component: update_user, name: 'update_user'},
    { path: '/import_posts', component: import_posts, name: 'import_posts'}
]

const router = new VueRouter ({
    routes: routes,
    base: '/login',
})

const app = new Vue({
    el: '#app',
    router: router,
})