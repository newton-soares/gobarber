import * as Yup from 'yup';
import User from '../models/User';

class UserController {
  async store(req, res) {
    // validações dos campos a serem fornecidos pelos usuários
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string()
        .required()
        .min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    // verificação se há um email igual ao que se está tentando cadastrar
    const userExists = await User.findOne({ where: { email: req.body.email } });

    // caso o email já exista no BD, será retornado a mensagem abaixo:
    if (userExists) {
      return res.status(400).json({ error: 'User already exists.' });
    }
    // retorna informação para o front-end
    const { id, name, email, provider } = await User.create(req.body);

    return res.json({ id, name, email, provider });
  }

  // Edição de usuários
  async update(req, res) {
    // validações dos campos a serem fornecidos pelos usuários
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
      oldPassword: Yup.string().min(6),
      password: Yup.string()
        .min(6)
        .when('oldPassword', (oldPassword, field) =>
          oldPassword ? field.required() : field
        ),
      confirmPassword: Yup.string().when('password', (password, field) =>
        password ? field.required().oneOf([Yup.ref('password')]) : field
      ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const { email, oldPassword } = req.body;

    const user = await User.findByPk(req.userId);

    if (email !== user.email) {
      // verificação se há um email igual ao que se está tentando cadastrar
      const userExists = await User.findOne({
        where: { email },
      });

      // caso o email já exista no BD, será retornado a mensagem abaixo:
      if (userExists) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
    }

    if (oldPassword && !(await user.checkPassword(oldPassword))) {
      return res.status(401).json({ error: 'Old password does not match' });
    }

    const { id, name, provider } = await user.update(req.body);

    return res.json({ id, name, email, provider });
  }
}

export default new UserController();
