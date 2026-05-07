const chainable = new Proxy(function() {}, {
  get: (target, prop) => {
    if (prop === 'then') {
      return (resolve) => resolve({ data: null, error: { message: "Supabase not configured" } });
    }
    return chainable;
  },
  apply: () => chainable
});

async function run() {
  const { data, error } = await chainable.select('*').eq('id', 1).limit(10);
  console.log('Result:', { data, error });
}
run();
