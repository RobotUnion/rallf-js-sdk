#! /usr/bin/python3

import sys
import select

print('asdasd')


while True:
    line = sys.stdin.readline()
    if line:
        # something(line)
        print(line)
        pass
    else:  # an empty line means stdin has been closed
        print('eof')
        exit(0)
else:
    print('empty')
