# JavaScript Closures

A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).

## Key Points

* Closures are created every time a function is created, at function creation time
* A closure lets you access variables from an outer function even after the outer function has finished executing

## Example

```javascript
function createCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
```

The inner function has access to the variables in the outer function scope, even after the outer function has returned.


