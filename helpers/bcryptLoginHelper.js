const bcrypt = require('bcrypt');

const comparePassword = async (plainPassword, hashedPassword) => {
  try {
    const finalNodeGeneratedHash = hashedPassword.startsWith('$2y$') ?
      hashedPassword.replace('$2y$', '$2b$') :
      hashedPassword;

    const result = await bcrypt.compare(plainPassword, finalNodeGeneratedHash);
    return result;
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    throw error;
  }
};

module.exports = comparePassword;