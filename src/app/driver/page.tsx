"use client";

import { useEffect, useRef } from "react";
import useSwr from "swr";

import { useMap } from "../hooks/useMap";
import { fetcher } from "../utils/http";
import { Route } from "../utils/model";
import { socket } from "../utils/socket-io";

export default function Driver() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);

  const {
    data: routes,
    error,
    isLoading,
  } = useSwr<Route[]>("http://localhost:3000/api/routes", fetcher, {
    fallbackData: [],
  });

	useEffect(() => {
		socket.connect();
		return () => {
			socket.disconnect();
		}
	}, []);

  async function startRoute() {
    const routeId = (document.getElementById("route") as HTMLSelectElement)
      .value;

    const response = await fetch(`http://localhost:3000/api/routes/${routeId}`);
    const route = await response.json();

    map?.removeAllRoutes();
    await map?.addRouteWithIcons({
      routeId,
      startMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location,
      },
      endMarkerOptions: {
        position: route.directions.routes[0].legs[0].end_location,
      },
      carMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location,
      },
    });

    const { steps } = route.directions.routes[0].legs[0];

    for (const step of steps) {
      await sleep(2000);
      map?.moveCar(routeId, step.start_location);
			socket.emit('new-points', {
				route_id: routeId,
				lat: step.start_location.lat,
				lng: step.start_location.lng,
			})

      await sleep(2000);
      map?.moveCar(routeId, step.end_location);
			socket.emit('new-points', {
				route_id: routeId,
				lat: step.end_location.lat,
				lng: step.end_location.lng,
			})
    }
  }

  return (
    <div className="flex flex-row">
      <div className="flex min-h-screen flex-col bg-slate-950 p-4 gap-4 w-64">
        <h1 className="text-white text-2xl">Minha viagem</h1>

        <div className="flex flex-col gap-2">
          <select id="route">
            {isLoading && <option>Carregando rotas...</option>}
            {routes!.map((route) => (
              <option key={route.id} value={route.id}>
                {route.name}
              </option>
            ))}
          </select>

          <button type="button" className="bg-yellow-400" onClick={startRoute}>
            Iniciar a viagem
          </button>
        </div>
      </div>
      <div
        className="flex min-h-screen w-full"
        id="map"
        ref={mapContainerRef}
      />
    </div>
  );
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
