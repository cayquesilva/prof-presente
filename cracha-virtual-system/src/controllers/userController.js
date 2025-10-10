const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");

// Validações para atualização de usuário
const updateUserValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Nome deve ter entre 2 e 255 caracteres"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Email inválido"),
  body("cpf")
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage("CPF deve estar no formato XXX.XXX.XXX-XX"),
  body("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Data de nascimento inválida"),
];

// Listar todos os usuários (apenas admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Obter usuário por ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        birthDate: true,
        phone: true,
        address: true,
        photoUrl: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
            userAwards: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar usuário
const updateUser = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { id } = req.params;
    const { name, email, cpf, birthDate, phone, address, password } = req.body;

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(409).json({
          error: "Email já está em uso",
        });
      }
    }

    // Verificar se o CPF já está em uso por outro usuário
    if (cpf && cpf !== existingUser.cpf) {
      const cpfExists = await prisma.user.findUnique({
        where: { cpf },
      });

      if (cpfExists) {
        return res.status(409).json({
          error: "CPF já está em uso",
        });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (cpf) updateData.cpf = cpf;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    // Hash da nova senha se fornecida
    if (password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        birthDate: true,
        phone: true,
        address: true,
        photoUrl: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Usuário atualizado com sucesso",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Deletar usuário
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Deletar usuário (cascade irá deletar relacionamentos)
    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: "Usuário deletado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar foto do perfil
const updateProfilePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { photoUrl },
    });

    // Remova a senha antes de enviar a resposta
    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      message: "Foto do perfil atualizada com sucesso",
      user: userWithoutPassword, // Envie o usuário atualizado de volta
    });
  } catch (error) {
    console.error("Erro ao atualizar foto do perfil:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Atualizar role do usuário (apenas admin)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar role
    const validRoles = [
      "ADMIN",
      "GESTOR_ESCOLA",
      "ORGANIZER",
      "CHECKIN_COORDINATOR",
      "TEACHER",
      "USER",
    ];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: "Role inválido. Valores permitidos: " + validRoles.join(", "),
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Atualizar role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    res.json({
      message: "Role do usuário atualizado com sucesso",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Erro ao atualizar role do usuário:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Redefinir senha do usuário (apenas admin)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        error: "Nova senha deve ter pelo menos 6 caracteres",
      });
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    // Hash da nova senha
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({
      message: "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfilePhoto,
  updateUserValidation,
  updateUserRole,
  resetUserPassword,
};
