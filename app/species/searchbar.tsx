export default function Searchbar({ onChange }: { onChange: (event: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <input
      type="text"
      placeholder="Search..."
      onChange={onChange}
      className="w-full max-w-md px-4 py-2 text-lg border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition duration-200"
    />
  );
}
