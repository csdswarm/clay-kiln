import SignUp from '../account/views/SignUp'
import CreateProfile from '../account/views/CreateProfile'
import UpdateProfile from '../account/views/UpdateProfile'
// import GenericError from '../views/GenericError'
// import Welcome from '../views/Welcome'
// import FacebookCallback from '../views/FacebookCallback'
import Login from '../account/views/Login'
// import GenericSuccess from '../views/GenericSuccess'
// import ForgotYourPassword from '../views/ForgotYourPassword'
// import ResetPassword from '../views/ResetPassword'
import UpdatePassword from '../account/views/UpdatePassword'
// import ResetPasswordSuccess from '../views/ResetPasswordSuccess'
// import EmailVerifiedSuccess from '../views/EmailVerifiedSuccess'
// import Home from '../views/Home'

const routes = [
  // {
  //   path: '/account/welcome',
  //   name: 'Welcome',
  //   component: Welcome,
  //   props: true,
  // },
  {
    path: '/account/profile',
    name: 'CreateProfile',
    component: CreateProfile,
    props: true
  },
  {
    path: '/account/profile/update',
    name: 'UpdateProfile',
    component: UpdateProfile,
    props: true
  },
  // {
  //   path: '/account/facebook-callback',
  //   name: 'FacebookCallback',
  //   component: FacebookCallback,
  //   props: true,
  // },
  {
    path: '/account/signup',
    name: 'SignUp',
    component: SignUp,
    props: true
  },
  // {
  //   path: '/account/reset-password',
  //   name: 'ResetPassword',
  //   component: ResetPassword,
  //   props: true,
  // },
  {
    path: '/account/password/update',
    name: 'UpdatePassword',
    component: UpdatePassword,
    props: true
  },
  // {
  //   path: '/account/reset-password/success',
  //   name: 'ResetPasswordSuccess',
  //   component: ResetPasswordSuccess,
  //   props: true,
  // },
  // {
  //   path: '/account/email-verification',
  //   name: 'EmailVerifiedSuccess',
  //   component: EmailVerifiedSuccess,
  // },
  {
    path: '/account/login',
    name: 'Login',
    component: Login
  }
  // {
  //   path: '/account/password/forgot',
  //   name: 'ForgotYourPassword',
  //   component: ForgotYourPassword,
  // },
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
