export default function Input({ label, error = '', ...restProps }) {
  return (
    <div className="flex flex-col gap-1 h-20">

      {label && <label className="text-sm font-medium">{label}</label>}

      <input
        className={`border p-2 rounded ${
          error ? 'border-red-400' : 'border-gray-300'
        }`}
        {...restProps}
      />

      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}