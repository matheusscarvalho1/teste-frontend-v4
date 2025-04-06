
import Map from "../map/map";

export const Homepage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-600">
      {/* <h1 className="text-3xl font-bold text-blue-600 underline hover:text-blue-800">
        Hello World!
      </h1>
      <Button className="pointer mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-700">
        Teste
      </Button>
      <Input placeholder="Digite seu nome" className="mt-4 w-2xl" /> */}
      <Map />
    </div>
  );
};
