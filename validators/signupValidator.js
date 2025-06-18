const { z } = require("zod");

const signupSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required.")
    .email("Please Enter a valid email address."),
  fname: z
    .string()
    .min(1, "First Name is required.")
    .regex(/^[A-Za-z\s]+$/, "First Name can only contain letters."),
  lname: z
    .string()
    .min(1, "Last Name is required.")
    .regex(/^[A-Za-z\s]+$/, "Last Name can only contain letters."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long.")
    .max(20, "Password must be less than 20 characters.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character."
    ),
  role: z.enum(["admin", "merchant", "member"], {
    required_error: "Role is required.",
  }),
});

module.exports = signupSchema;
