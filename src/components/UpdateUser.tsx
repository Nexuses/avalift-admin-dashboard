import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export function UpdateUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    status: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
 
    console.log(`Updated user ${id}`, formData);
    navigate("/"); 
  };

  return (
    <div className="w-full max-w-md mx-auto mt-8">
      <h1 className="text-xl font-semibold mb-4">Update User {id}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />
        <input
          type="text"
          name="mobile"
          placeholder="Mobile"
          value={formData.mobile}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />
        <input
          type="text"
          name="status"
          placeholder="Status"
          value={formData.status}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Save
        </button>
      </form>
    </div>
  );
}
