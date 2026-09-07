# Performance



miki-template is built for real-world apps. Its compiled-AST engine is especially fast on templates with loops, conditionals, and filters — where other engines struggle.



## Benchmark Results



Renders per second (higher is better):



| Template | miki-template | pug | handlebars | ejs |

|----------|--------------|-----|------------|-----|

| Small | ~115k rps | 1.7M rps | 417k rps | 182k rps |

| Medium | ~454k rps | 625k rps | 48k rps | 29k rps |

| Large | **~476k rps** | 3.1k rps | 661 rps | 290 rps |



## Key Takeaways



- On **small** templates, miki-template has overhead from the compiled AST approach.

- On **medium** templates, miki-template is competitive with pug.

- On **large/realistic** templates (the ones that matter in production), miki-template **dominates by ~150×**.



## Why miki-template Wins on Real Templates



- **Compiled AST**: Templates are compiled once and reused, avoiding repeated parsing.

- **No runtime interpretation**: No string concatenation or function reconstruction per render.

- **Optimized loops and filters**: for-loops and filters are implemented as efficient node traversals.

- **Cache-friendly**: Compiled templates are cached by default.



## Running Benchmarks



```bash

npm run bench

```



## Next Steps



- [Getting Started](guide/getting-started.md)

- [API Reference](api/index.md)

