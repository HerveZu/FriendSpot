FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

COPY . .
RUN dotnet restore

WORKDIR /app/Api
RUN dotnet publish -c release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0
COPY --from=build /out /out
WORKDIR /out
ENTRYPOINT ["dotnet", "Api.dll"]
