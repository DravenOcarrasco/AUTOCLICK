(async function () {
    /**
     * Function to create a module context with WebSocket, storage, and custom data capabilities.
     * This function returns a context object with methods that allow interaction with WebSocket events, 
     * storage, and custom data management.
     *
     * @param {string} moduleName - The name of the module.
     * @returns {{
    *   CONTEXT.MODULE_NAME: string,
    *   SOCKET: object,
    *   KEYBOARD_COMMANDS: Array<object>,
    *   setStorage: (key: string, value: any, isGlobal: boolean) => Promise<object>,
    *   getStorage: (key: string, isGlobal: boolean) => Promise<object>,
    *   getVariable: (variableName: string, defaultValue: any, create: boolean, isGlobal: boolean) => Promise<any>,
    *   showMenu: (options: Array<object>) => void,
    *   getCustomData: (key: string) => any,
    *   setCustomData: (key: string, value: any) => void
    *   setMenuHandler: (handlerFunction: function) => void
    * }} - The context object with methods for WebSocket, storage, and custom data.
   */
    function createContext(moduleName) {
        return window.WSACTION.createModuleContext(moduleName);
    }

    // Criar o contexto para o módulo utilizando a função createModuleContext
    const CONTEXT = createContext("AUTOCLICK");

    const SOCKET = CONTEXT.SOCKET;
    CONTEXT.KEYBOARD_COMMANDS = [
        {
            description: "Show Auto Click Menu",
            keys: [
                {
                    key: "control",
                    upercase: false
                },
                {
                    key: "left click",
                    upercase: false
                }
            ]
        }
    ]

    let currentTargetElement = null; // Armazena o elemento alvo atual

    // Função para capturar ações de clique
    function captureClick(event) {
        if (event.ctrlKey) {
            event.preventDefault(); // Previne o comportamento padrão
            // Armazena o elemento no qual o usuário clicou enquanto segurava Ctrl
            currentTargetElement = event.target;
            // Mostra o formulário para capturar as configurações do AutoClick
            showAutoClickForm();
        }
    }

    // Função para exibir o formulário de configuração do AutoClick
    function showAutoClickForm() {
        Swal.fire({
            title: 'Configurar AutoClick',
            html: `
                <label for="clicksCount">Quantas vezes clicar?</label>
                <input id="clicksCount" type="number" min="1" value="1" class="swal2-input">

                <label for="delayBetweenClicks">Tempo de delay entre os cliques (ms)</label>
                <input id="delayBetweenClicks" type="number" min="0" value="1000" class="swal2-input">

                <label for="isRandomDelay">Delay aleatório?</label>
                <input id="isRandomDelay" type="checkbox" class="swal2-checkbox">
            `,
            showCancelButton: true,
            confirmButtonText: 'Iniciar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const clicksCount = document.getElementById('clicksCount').value;
                const delayBetweenClicks = document.getElementById('delayBetweenClicks').value;
                const isRandomDelay = document.getElementById('isRandomDelay').checked;

                return {
                    clicksCount: parseInt(clicksCount, 10),
                    delayBetweenClicks: parseInt(delayBetweenClicks, 10),
                    isRandomDelay
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { clicksCount, delayBetweenClicks, isRandomDelay } = result.value;
                startAutoClick(clicksCount, delayBetweenClicks, isRandomDelay);
            }
        });
    }

    // Função para iniciar o AutoClick
    function startAutoClick(clicksCount, delayBetweenClicks, isRandomDelay) {
        let clicksDone = 0;

        const autoClickInterval = setInterval(() => {
            if (clicksDone >= clicksCount) {
                clearInterval(autoClickInterval);
                Swal.fire('Concluído!', `Clicou ${clicksCount} vezes.`, 'success');
                return;
            }

            // Executa o clique no elemento armazenado
            if (currentTargetElement) {
                currentTargetElement.click();
                clicksDone++;
            }

            // Determina o próximo delay (fixo ou aleatório)
            const nextDelay = isRandomDelay
                ? Math.floor(Math.random() * delayBetweenClicks)
                : delayBetweenClicks;

            clearInterval(autoClickInterval); // Limpa o intervalo atual
            startAutoClick(clicksCount - clicksDone, nextDelay, isRandomDelay); // Inicia o próximo clique

        }, delayBetweenClicks);
    }

    SOCKET.on('connect', () => {
        console.log(`${CONTEXT.MODULE_NAME} Conectado ao servidor WebSocket`);

        SOCKET.on(`${CONTEXT.MODULE_NAME}:event`, (data) => {
            console.log('Evento recebido:', data);
        });
    });

    SOCKET.on('disconnect', () => {
        console.log(`${CONTEXT.MODULE_NAME} Desconectado do servidor WebSocket`);
    });

    // Adiciona o listener de clique com Ctrl
    document.addEventListener('click', captureClick, true);

    // Register the extension in the global context
    if (window.extensionContext) {
        window.extensionContext.addExtension(CONTEXT.MODULE_NAME, {
            location: window.location,
            ...CONTEXT
        });
    }
})();
