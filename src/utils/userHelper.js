export const getUserDisplayName = (user, fallback = "Tài khoản") =>
  user?.full_name ||
  user?.fullName ||
  user?.name ||
  fallback;

export const isEmailLike = (value) => typeof value === "string" && value.includes("@");
