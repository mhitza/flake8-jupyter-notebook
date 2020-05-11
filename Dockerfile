FROM fedora:32

RUN dnf install --assumeyes --quiet python3 python3-pip node && dnf clean all

RUN pip3 install flake8_nb

COPY entrypoint.sh /entrypoint.sh
COPY annotate /annotate

ENTRYPOINT ["/entrypoint.sh"]
