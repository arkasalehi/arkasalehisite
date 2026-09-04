import { ProductEditor } from "@/components/admin/ProductEditor";

export default function NewProductPage() {
  return (
    <section>
      <h1 className="text-3xl font-medium">محصول جدید</h1>
      <div className="mt-6">
        <ProductEditor />
      </div>
    </section>
  );
}
