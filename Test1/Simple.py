import math
import cmath

# Set or read the number (example uses hardcoded value)
num = 8.0

# Compute square root safely: use real sqrt for non-negative, complex sqrt otherwise
if num >= 0:
    num_sqrt = math.sqrt(num)
else:
    num_sqrt = cmath.sqrt(num)

# Print with appropriate formatting depending on real/complex result
if isinstance(num_sqrt, complex):
    print(f'The square root of {num} is {num_sqrt}')
else:
    print(f'The square root of {num:.3f} is {num_sqrt:.3f}')
