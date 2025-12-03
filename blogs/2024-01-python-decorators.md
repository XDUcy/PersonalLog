# Python Decorators

Decorators are a powerful and expressive feature in Python that allow you to modify the behavior of functions or classes.

## Key Concepts

* Decorators are functions that take another function as an argument and extend its behavior
* They use the @decorator syntax above the function definition
* Common uses include logging, timing, access control, and caching

## Example

```python
def timing_decorator(func):
    def wrapper(*args, **kwargs):
        import time
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        print(f"Function {func.__name__} took {end_time - start_time:.2f} seconds to run")
        return result
    return wrapper

@timing_decorator
def slow_function():
    import time
    time.sleep(1)
    return "Function completed"

slow_function()  # Will print timing information
```


