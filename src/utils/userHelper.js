export const getUserDisplayName = (user, fallback = "Tài khoản") =>
  user?.full_name ||
  user?.fullName ||
  user?.name ||
  user?.username ||
  user?.email ||
  user?.phone_number ||
  fallback;

export const isEmailLike = (value) => typeof value === "string" && value.includes("@");
