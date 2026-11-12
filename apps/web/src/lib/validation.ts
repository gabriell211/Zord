import { z } from "zod";

export const loginSchema = z.strictObject({
    usuario: z.string().trim().min(2, "Informe seu usuário.").max(254),
    senha: z.string().min(1, "Informe sua senha.").max(4096),
});

export const clienteSchema = z.strictObject({
    nome: z.string().trim().min(2, "Informe o nome do cliente.").max(160),
    email: z.union([z.email().max(254), z.literal("")]).optional(),
    telefone: z.string().trim().max(32).regex(/^[+()\d\s.-]*$/, "Telefone inválido.").optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
