import { z } from "zod";

export const loginSchema = z.strictObject({
    usuario: z.string().trim().min(2, "Informe seu usuário.").max(254),
    senha: z.string().min(1, "Informe sua senha.").max(256),
});

export const clienteSchema = z.strictObject({
    nome: z.string().trim().min(2, "Informe o nome do cliente.").max(160),
    email: z.union([z.email().max(254), z.literal("")]).optional(),
    telefone: z.string().trim().max(32).regex(/^[+()\d\s.-]*$/, "Telefone inválido.").optional(),
});

export const atualizarClienteSchema = clienteSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    "Informe pelo menos uma alteração.",
);

export const configuracaoInicialSchema = z.strictObject({
    token: z.string().min(32, "Informe a chave de instalação.").max(256),
    empresa: z.string().trim().min(2, "Informe o nome da empresa.").max(160),
    nome: z.string().trim().min(2, "Informe seu nome.").max(160),
    email: z.email().max(254).transform((value) => value.toLowerCase()),
    senha: z.string().min(12, "Utilize pelo menos 12 caracteres.").max(256),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type AtualizarClienteInput = z.infer<typeof atualizarClienteSchema>;
export type ConfiguracaoInicialInput = z.infer<typeof configuracaoInicialSchema>;
