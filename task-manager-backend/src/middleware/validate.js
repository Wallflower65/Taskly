const { z } = require('zod');

const authSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

const validateAuth = (req, res, next) => {
  const result = authSchema.safeParse(req.body);
  
  if (!result.success) {
    const fallbackMessage = result.error.errors[0].message;
    return res.status(400).json({ error: fallbackMessage });
  }
  
  next();
};

module.exports = { validateAuth };