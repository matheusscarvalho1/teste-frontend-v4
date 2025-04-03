import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export const Homepage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold underline text-blue-600 hover:text-blue-800">
        Hello World!
      </h1>
      <Button className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 pointer">
        Teste
      </Button>
      <Input placeholder="Digite seu nome" className="mt-4 w-2xl" />
    </div>
  );
};
