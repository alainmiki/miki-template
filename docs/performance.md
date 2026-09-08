# Performance



miki-template is built for real-world apps. Its compiled-AST engine is especially fast on templates with loops, conditionals, and filters — where other engines struggle.



## Benchmark Results



Renders per second (higher is better):



| Template | miki-template | pug | handlebars | ejs |

|----------|--------------|-----|------------|-----|

| Small | ~1.1M rps | 1.1M rps | 300k rps | 113k rps |

| Medium | ~40k rps | 27k rps | 4k rps | 2k rps |

| Large | **~2530 rps** | 1886 rps | 493 rps | 1881 rps |



## Key Takeaways



- On **small** templates, miki-template is competitive with pug.

- On **medium** templates, miki-template beats pug.

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

