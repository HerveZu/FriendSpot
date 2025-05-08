import { isEmail } from 'validator';
import { Validator } from '~/form/FormInput';
import { notEmpty } from '~/lib/utils';

export const Validators = {
  email: {
    validate: (email: string) => !email || isEmail(email),
    message: "L'adresse e-mail n'est pas valide",
  } as Validator,
  required: {
    validate: notEmpty,
    message: 'Ce champ est requis',
  } as Validator,
};
