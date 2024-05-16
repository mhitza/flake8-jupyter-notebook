FROM fedora:40

RUN dnf install --assumeyes --quiet python3 python3-pip nodejs && dnf clean all
RUN pip3 install flake8==7.0.0

COPY entrypoint.sh /entrypoint.sh
COPY annotate /annotate

ENTRYPOINT ["/entrypoint.sh"]
