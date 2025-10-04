const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads/";

    // Definir subpasta baseada no tipo de upload
    if (file.fieldname === "photo" || file.fieldname === "profilePhoto") {
      uploadPath += "profiles/";
    } else if (file.fieldname === "eventImage") {
      uploadPath += "events/";
    } else {
      uploadPath += "misc/";
    }

    // Criar diretório se não existir
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// Filtro de arquivos (apenas imagens)
const fileFilter = (req, file, cb) => {
  // Verificar se é uma imagem
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos"), false);
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB por padrão
  },
});

// Middleware para tratar erros de upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "Arquivo muito grande. Tamanho máximo permitido: 5MB",
      });
    } else if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Muitos arquivos enviados",
      });
    } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Campo de arquivo inesperado",
      });
    }
  } else if (error) {
    return res.status(400).json({
      error: error.message,
    });
  }

  next();
};

// Middleware específicos para diferentes tipos de upload
const uploadProfilePhoto = upload.single("photo");
const uploadEventImage = upload.single("eventImage");

// Função para garantir que o diretório de uploads exista
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Configuração de armazenamento para templates de crachá
const badgeTemplateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/badge-templates";
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Ex: event-template-{eventId}-{timestamp}.png
    const uniqueSuffix = `${req.params.id}-${Date.now()}`;
    cb(
      null,
      `event-template-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

// Filtro de arquivo para aceitar apenas imagens
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos!"), false);
  }
};

const uploadBadgeTemplate = multer({
  storage: badgeTemplateStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite de 5MB
}).single("badgeTemplate"); // 'badgeTemplate' é o nome do campo no formulário

// NOVA CONFIGURAÇÃO: Armazenamento para imagens de insígnias
const insigniaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/insignias'; // Salvará em uma pasta dedicada
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `insignia-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// NOVO: Middleware de upload para a imagem da insígnia
const uploadInsignia = multer({
  storage: insigniaStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 1024 * 1024 * 2 } // Limite de 2MB por imagem
}).single('imageUrl'); // 'imageUrl' será o nome do campo no formulário de upload


module.exports = {
  upload,
  uploadProfilePhoto,
  uploadEventImage,
  handleUploadError,
  uploadBadgeTemplate,
  uploadInsignia,
};
