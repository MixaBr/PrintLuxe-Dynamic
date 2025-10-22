{ pkgs, ... }: { # Добавили "..." для полной совместимости Nix
  # Используемый канал nixpkgs.
  channel = "stable-24.11";

  # Используй https://search.nixos.org/packages для поиска пакетов
  packages = [
    pkgs.nodejs_20 # Важно для TypeScript/JavaScript
    # pkgs.zulu   # Раскомментируй, если нужен Java (JDK)
    # pkgs.gh     # Раскомментируй, если нужен GitHub CLI
  ];

  # Устанавливает переменные окружения в рабочем пространстве
  env = {}; # Ты можешь добавить сюда переменные окружения, например: MY_API_KEY="your_key"

  idx = {
    # Ищи расширения на https://open-vsx.org/ и используй "publisher.id"
    extensions = [
      # "angular.ng-template" # Пример, раскомментируй, если нужно
      # "vscodevim.vim"
    ];

    # Включает и настраивает превью для твоего веб-приложения
    previews = {
      enable = true;
      previews = {
        web = {
          command = [
            "npm"
            "run"
            "dev"
            "--"
            "--port"
            "$PORT"
            "--hostname"
            "0.0.0.0"
          ];
          manager = "web";
          # При необходимости укажи директорию, содержащую твоё веб-приложение (например, "frontend" или "app/client")
          # cwd = "app/client";
        };
      };
    };

    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
  };

  # Если ты хочешь запускать эмуляторы Firebase, тебе нужно включить их явно:
  # services.firebase.emulators = {
  #   detect = true; # Установи true, чтобы Firebase Studio пыталась запустить эмуляторы
  #   projectId = "remontprinterovorder"; # Используй свой Project ID
  #   services = ["auth" "firestore"]; # Укажи, какие эмуляторы нужны
  # };
}
