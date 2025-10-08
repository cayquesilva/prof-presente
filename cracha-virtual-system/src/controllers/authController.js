const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { prisma } = require("../config/database");
const { generateToken } = require("../utils/jwt");

// Validações para registro
const registerValidation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Nome deve ter entre 2 e 255 caracteres"),
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Senha deve ter pelo menos 6 caracteres"),
  body("birthDate").isISO8601().withMessage("Data de nascimento inválida"),
  body("cpf")
    .optional()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
    .withMessage("CPF deve estar no formato XXX.XXX.XXX-XX"),
  body("contractType")
    .optional()
    .isIn(["EFETIVO", "PRESTADOR"])
    .withMessage("Tipo de vínculo inválido"),
  body("workShifts")
    .optional()
    .isArray()
    .withMessage("Turnos devem ser um array."),
  body("workShifts.*")
    .isIn(["MANHA", "TARDE", "NOITE", "INTEGRAL"])
    .withMessage("Turno inválido."),

  body("teachingSegments")
    .optional()
    .isArray()
    .withMessage("Segmentos de ensino devem ser um array."),
  body("teachingSegments.*")
    .isIn(["INFANTIL", "FUNDAMENTAL1", "FUNDAMENTAL2", "EJA", "ADMINISTRATIVO"])
    .withMessage("Segmento de ensino inválido."),
];

// Validações para login
const loginValidation = [
  body("email").isEmail().normalizeEmail().withMessage("Email inválido"),
  body("password").notEmpty().withMessage("Senha é obrigatória"),
];

// Registrar usuário
const register = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const {
      name,
      email,
      password,
      cpf,
      birthDate,
      phone,
      address,
      workplaceIds,
      neighborhood, // NOVO
      professionName, // Pode vir como nome
      workShifts, // NOVO
      contractType, // NOVO
      teachingSegments, // NOVO
    } = req.body;

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email já está em uso",
      });
    }

    // Verificar se o CPF já existe (se fornecido)
    if (cpf) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf },
      });

      if (existingCpf) {
        return res.status(409).json({
          error: "CPF já está em uso",
        });
      }
    }

    // LÓGICA PARA MÚLTIPLAS UNIDADES
    let workplacesConnect = undefined;
    if (
      workplaceIds &&
      Array.isArray(workplaceIds) &&
      workplaceIds.length > 0
    ) {
      workplacesConnect = workplaceIds.map((id) => ({ id }));
    }

    // LÓGICA DE PROFISSÃO
    let professionConnectOrCreate = undefined;
    if (professionName) {
      professionConnectOrCreate = {
        where: { name: professionName.trim() },
        create: { name: professionName.trim() },
      };
    }

    // Hash da senha
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        cpf: cpf || null,
        birthDate: new Date(birthDate),
        phone: phone || null,
        address: address || null,
        neighborhood: neighborhood || null, // NOVO
        workShifts: workShifts,
        contractType: contractType || null, // NOVO
        teachingSegments: teachingSegments,
        photoUrl: null, // photoUrl será adicionado depois se houver upload
        profession: professionName
          ? { connectOrCreate: professionConnectOrCreate }
          : undefined,
        workplaces: workplacesConnect
          ? { connect: workplacesConnect }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        photoUrl: true,
      },
    });

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      user,
    });
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta.target.join(", ");
      return res
        .status(409)
        .json({ error: `Conflito: O campo '${field}' já está em uso.` });
    }
    console.error("Erro no registro:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
};

// Login do usuário
const login = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Credenciais inválidas",
      });
    }

    // Gerar token JWT
    const token = generateToken({ userId: user.id });

    // Retornar dados do usuário (sem senha)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login realizado com sucesso",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

// Obter perfil do usuário logado
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuário não encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Erro ao obter perfil:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  registerValidation,
  loginValidation,
};
