import { userService } from "./userService";

export const authService = {
  login: userService.login,
  refreshToken: userService.refreshToken,
  logout: userService.logout,
  register: userService.register,
  verifyOTP: userService.verifyOTP,
  forgotPassword: userService.forgotPassword,
  resetPassword: userService.resetPassword,
  resendOTP: userService.resendOTP,
};

export default authService;
