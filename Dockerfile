FROM mhitza/flake8-nb:latest

COPY entrypoint.sh /entrypoint.sh
COPY annotate /annotate

ENTRYPOINT ["/entrypoint.sh"]
