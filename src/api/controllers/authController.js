const { User } = require('../../models');
const { hashPassword, comparePassword } = require('../../utils/password');
const { generateToken } = require('../../utils/jwt');

/**
 * Connexion
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
      });
    }

    // Vérifier le mot de passe
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
      });
    }

    // Générer le token
    const token = generateToken({
      userId: user._id,
      globalRole: user.globalRole,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        discordId: user.discordId,
        globalRole: user.globalRole,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Inscription
 */
const register = async (req, res) => {
  try {
    const { email, password, username, discordId } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe et nom d\'utilisateur requis',
      });
    }

    // Vérifier si un utilisateur avec cet email existe déjà
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail && existingUserByEmail.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Un compte existe déjà avec cet email',
      });
    }

    // Si un utilisateur avec ce Discord ID existe (créé par admin), on le complète
    if (discordId) {
      const existingUserByDiscord = await User.findOne({ discordId });
      if (existingUserByDiscord && !existingUserByDiscord.passwordHash) {
        // Compléter le compte existant
        existingUserByDiscord.email = email;
        existingUserByDiscord.username = username;
        existingUserByDiscord.passwordHash = await hashPassword(password);
        await existingUserByDiscord.save();

        const token = generateToken({
          userId: existingUserByDiscord._id,
          globalRole: existingUserByDiscord.globalRole,
        });

        return res.status(200).json({
          success: true,
          token,
          user: {
            id: existingUserByDiscord._id,
            email: existingUserByDiscord.email,
            username: existingUserByDiscord.username,
            discordId: existingUserByDiscord.discordId,
            globalRole: existingUserByDiscord.globalRole,
          },
        });
      }
    }

    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);

    // Créer l'utilisateur
    const user = await User.create({
      email,
      passwordHash,
      username,
      discordId: discordId || undefined,
      globalRole: null,
    });

    // Générer le token
    const token = generateToken({
      userId: user._id,
      globalRole: user.globalRole,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        discordId: user.discordId,
        globalRole: user.globalRole,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir l'utilisateur courant
 */
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        discordId: user.discordId,
        globalRole: user.globalRole,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Obtenir l'URL de redirection Discord OAuth2
 */
const getDiscordAuthUrl = (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_OAUTH_REDIRECT_URI);
  const scope = 'identify email guilds';
  
  if (!clientId) {
    return res.status(500).json({
      success: false,
      message: 'DISCORD_CLIENT_ID non configuré',
    });
  }
  
  if (!process.env.DISCORD_OAUTH_REDIRECT_URI) {
    return res.status(500).json({
      success: false,
      message: 'DISCORD_OAUTH_REDIRECT_URI non configuré',
    });
  }
  
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  
  console.log('[Discord OAuth] URL générée:', authUrl);
  console.log('[Discord OAuth] Redirect URI:', process.env.DISCORD_OAUTH_REDIRECT_URI);
  
  res.json({
    success: true,
    url: authUrl,
  });
};

/**
 * Callback Discord OAuth2
 * Échange le code contre un access token et récupère les infos utilisateur
 */
const discordCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code manquant',
      });
    }

    console.log('[Discord OAuth] Code reçu:', code.substring(0, 10) + '...');

    const axios = require('axios');
    const FormData = require('form-data');

    // Échanger le code contre un access token
    const tokenData = new FormData();
    tokenData.append('client_id', process.env.DISCORD_CLIENT_ID);
    tokenData.append('client_secret', process.env.DISCORD_CLIENT_SECRET);
    tokenData.append('grant_type', 'authorization_code');
    tokenData.append('code', code);
    tokenData.append('redirect_uri', process.env.DISCORD_OAUTH_REDIRECT_URI);

    console.log('[Discord OAuth] Échange du code contre un token...');
    console.log('[Discord OAuth] Redirect URI utilisé:', process.env.DISCORD_OAUTH_REDIRECT_URI);

    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      tokenData,
      {
        headers: tokenData.getHeaders(),
      }
    );

    const { access_token } = tokenResponse.data;
    console.log('[Discord OAuth] Token reçu avec succès');

    // Récupérer les infos utilisateur Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const discordUser = userResponse.data;
    console.log('[Discord OAuth] Utilisateur Discord récupéré:', discordUser.username, '-', discordUser.id);

    // Chercher ou créer l'utilisateur
    let user = await User.findOne({ discordId: discordUser.id });

    if (!user) {
      // Vérifier si un utilisateur avec cet email Discord existe
      const userByEmail = discordUser.email ? await User.findOne({ email: discordUser.email }) : null;
      
      if (userByEmail && !userByEmail.discordId) {
        // Lier le Discord ID au compte existant
        userByEmail.discordId = discordUser.id;
        userByEmail.username = discordUser.username;
        userByEmail.avatar = discordUser.avatar || null;
        await userByEmail.save();
        user = userByEmail;
        console.log('[Discord OAuth] Compte existant lié au Discord ID');
      } else {
        // Créer un nouvel utilisateur
        const randomPassword = Math.random().toString(36).slice(-12);
        const passwordHash = await hashPassword(randomPassword);

        user = await User.create({
          discordId: discordUser.id,
          email: discordUser.email || `${discordUser.id}@discord.temp`,
          username: discordUser.username,
          avatar: discordUser.avatar || null,
          passwordHash,
          globalRole: null,
        });
        console.log('[Discord OAuth] Nouvel utilisateur créé');
      }
    } else {
      // Mettre à jour les infos (important si c'était un placeholder créé depuis permissions)
      const wasPlaceholder = user.email && user.email.includes('@discord.placeholder');
      
      user.username = discordUser.username;
      if (discordUser.email && (discordUser.email !== `${discordUser.id}@discord.temp` || wasPlaceholder)) {
        user.email = discordUser.email;
      }
      user.avatar = discordUser.avatar || null;
      
      // Si le compte a été créé par un admin sans password, on en génère un
      if (!user.passwordHash) {
        const randomPassword = Math.random().toString(36).slice(-12);
        user.passwordHash = await hashPassword(randomPassword);
      }
      
      await user.save();
      
      if (wasPlaceholder) {
        console.log('[Discord OAuth] Utilisateur placeholder complété avec les infos Discord réelles');
      } else {
        console.log('[Discord OAuth] Utilisateur existant mis à jour');
      }
    }

    // Générer le token JWT
    const token = generateToken({
      userId: user._id,
      globalRole: user.globalRole,
    });

    console.log('[Discord OAuth] Connexion réussie pour:', user.username);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        discordId: user.discordId,
        globalRole: user.globalRole,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('[Discord OAuth] Erreur:', error.response?.data || error.message);
    console.error('[Discord OAuth] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification Discord',
      details: error.response?.data || error.message,
    });
  }
};

module.exports = {
  login,
  register,
  me,
  getDiscordAuthUrl,
  discordCallback,
};
