import { LoginForm } from './LoginForm';
export const LoginPage = () => (
  <main className="grid min-h-dvh lg:grid-cols-2">
    <section aria-label="ObraFlow / Dokimos" className="flex flex-col justify-between bg-foreground px-6 py-8 text-background sm:px-12 lg:p-16">
      <p className="text-2xl font-semibold tracking-tight">ObraFlow<span className="text-brand">.</span></p>
      <div className="hidden max-w-lg py-20 lg:block">
        <h1 className="text-5xl font-semibold leading-tight tracking-tight">Clareza para decidir.<br />Confiança para seguir.</h1>
        <p className="mt-6 max-w-sm text-lg leading-8">Pedidos e aprovações, com cada etapa no seu lugar.</p>
      </div>
      <p className="mt-4 text-sm lg:mt-0">Dokimos · Aprovações de compra</p>
    </section>
    <section aria-labelledby="login-title" className="flex items-center justify-center px-6 py-12 sm:p-12 lg:rounded-l-3xl lg:bg-background">
      <div className="w-full max-w-sm">
        <h2 id="login-title" className="text-3xl font-semibold tracking-tight">Entre na sua conta</h2>
        <p className="mb-9 mt-3 text-base leading-7 text-muted-foreground">Acesse o ambiente de pedidos e aprovações da sua equipe.</p>
        <LoginForm />
        <p className="mt-9 text-sm leading-6 text-muted-foreground">Precisa de acesso? Fale com a administração da sua empresa.</p>
      </div>
    </section>
  </main>
);
