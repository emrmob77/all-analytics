import Layout from "./components/layout/Layout";

function App() {
  return (
    <Layout>
      <section className="rounded-xl border border-border-light bg-surface-light p-6 dark:border-border-dark dark:bg-surface-dark">
        <h2 className="mb-2 text-lg font-semibold">Task 2.1 tamamlandı</h2>
        <p className="text-text-muted-light dark:text-text-muted-dark">
          Layout artık sidebar, header ve main content bölgeleriyle çalışıyor.
        </p>
      </section>
    </Layout>
  );
}

export default App;
