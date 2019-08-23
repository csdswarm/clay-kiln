import SignUp from '../account/views/SignUp'
import CreateProfile from '../account/views/CreateProfile'
import UpdateProfile from '../account/views/UpdateProfile'
// import Welcome from '../views/Welcome'
import Login from '../account/views/Login'
import ForgotYourPassword from '../account/views/ForgotYourPassword'
import ResetPassword from '../account/views/ResetPassword'
// import GenericSuccess from '../account/views/GenericSuccess'
import UpdatePassword from '../account/views/UpdatePassword'
// import EmailVerifiedSuccess from '../views/EmailVerifiedSuccess'
// import Home from '../views/Home'

const routes = [
  // {
  //   path: '/account/welcome',
  //   name: 'Welcome',
  //   component: Welcome
  // },
  {
    path: '/account/profile',
    name: 'CreateProfile',
    component: CreateProfile
  },
  {
    path: '/account/profile/update',
    name: 'UpdateProfile',
    component: UpdateProfile
  },
  {
    path: '/account/signup',
    name: 'SignUp',
    component: SignUp
  },
  {
    path: '/account/reset-password',
    name: 'ResetPassword',
    component: ResetPassword
  },
  {
    path: '/account/password/update',
    name: 'UpdatePassword',
    component: UpdatePassword
  },
  // {
  //   path: '/account/email-verification',
  //   name: 'EmailVerifiedSuccess',
  //   component: EmailVerifiedSuccess,
  // },
  {
    path: '/account/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/account/password/forgot',
    name: 'ForgotYourPassword',
    component: ForgotYourPassword
  }
  // {
  //   path: '/account/success',
  //   name: 'GenericSuccess',
  //   component: GenericSuccess,
  // },
  // {
  //   path: '/',
  //   name: 'Home',
  //   component: Home,
  // }
]
export default routes
